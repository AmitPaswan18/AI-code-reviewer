import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../config/database';
import { decrypt } from '../utils/encryption';
import { Octokit } from '@octokit/rest';
import { GoogleGenAI } from '@google/genai';

export async function reviewRoutes(fastify: FastifyInstance) {
    fastify.post('/api/repos/:owner/:repo/pulls/:pullNumber/review', async (request: FastifyRequest<{ Params: { owner: string; repo: string; pullNumber: string }; Body: { clerkId: string } }>, reply: FastifyReply) => {
        try {
            const { owner, repo, pullNumber } = request.params;
            const { clerkId } = request.body;

            if (!clerkId) {
                return reply.code(400).send({ error: 'clerkId is required' });
            }

            const user = await prisma.user.findUnique({
                where: { clerkId }
            });

            if (!user || !user.githubAccessToken) {
                return reply.code(400).send({ error: 'GitHub account not connected' });
            }

            let accessToken;
            try {
                accessToken = decrypt(user.githubAccessToken);
            } catch (error) {
                return reply.code(500).send({ error: 'Authentication error' });
            }

            const octokit = new Octokit({ auth: accessToken });

            // Ensure the repository exists in our DB
            let repository = await prisma.repository.findFirst({
                where: { repoFullName: `${owner}/${repo}`, userId: user.id }
            });

            if (!repository) {
                // Fetch from github and create
                const { data: githubRepo } = await octokit.repos.get({ owner, repo });
                repository = await prisma.repository.create({
                    data: {
                        userId: user.id,
                        githubRepoId: BigInt(githubRepo.id),
                        repoName: githubRepo.name,
                        repoFullName: githubRepo.full_name,
                        repoOwner: githubRepo.owner.login,
                        isPrivate: githubRepo.private,
                        description: githubRepo.description,
                        defaultBranch: githubRepo.default_branch,
                        isActive: true
                    }
                });
            }

            // Fetch the PR diff
            const diffResponse = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
                owner,
                repo,
                pull_number: parseInt(pullNumber),
                headers: {
                    accept: 'application/vnd.github.v3.diff'
                }
            });

            const diffText = diffResponse.data as unknown as string;

            // Analyze with Gemini
            let aiSummary = "No AI summary generated.";
            let riskScore = 15;
            let comments: any[] = [];

            const geminiKey = process.env.GEMINI_API_KEY;

            if (geminiKey) {
                try {
                    const ai = new GoogleGenAI({ apiKey: geminiKey });
                    const response = await ai.models.generateContent({
                        model: 'gemini-2.5-flash',
                        contents: `You are an AI code reviewer. Analyze this PR diff and extract a summary, risk score (0-100), and an array of comments for the PR. Format strictly as JSON.
{
  "summary": "String explaining the changes briefly",
  "riskScore": 25,
  "comments": [
    {
      "commentType": "BUG",
      "severity": "MEDIUM",
      "message": "Potential issue..."
    }
  ]
}

PR Diff:
${diffText.slice(0, 30000)}`,
                        config: {
                            responseMimeType: "application/json",
                        }
                    });

                    if (response.text) {
                        const parsed = JSON.parse(response.text);
                        aiSummary = parsed.summary || aiSummary;
                        riskScore = parsed.riskScore || riskScore;
                        comments = parsed.comments || [];
                    }
                } catch (aiErr) {
                    fastify.log.error(aiErr, 'AI Gen Error');
                }
            } else {
                // Fallback dummy simulation
                aiSummary = "This PR looks mostly okay, but lacks a Gemini key to perform full review.";
                riskScore = 10;
                comments = [{ commentType: 'SUGGESTION', severity: 'LOW', message: "Add an API key for GEMINI in .env" }];
            }

            const { data: pullData } = await octokit.pulls.get({
                owner,
                repo,
                pull_number: parseInt(pullNumber)
            });

            // Post Review to GitHub
            let githubReviewBody = `### 🤖 AI Code Review Summary\n\n**Risk Score:** ${riskScore}/100\n\n${aiSummary}\n\n`;
            if (comments.length > 0) {
                githubReviewBody += `### 📝 Findings\n`;
                comments.forEach((c) => {
                    const icon = c.commentType === 'BUG' ? '🐞' : c.commentType === 'SECURITY' ? '🔒' : c.commentType === 'PERFORMANCE' ? '⚡' : '💡';
                    githubReviewBody += `- **${icon} [${c.severity}] ${c.commentType}**: ${c.message}\n`;
                });
            }

            try {
                await octokit.pulls.createReview({
                    owner,
                    repo,
                    pull_number: parseInt(pullNumber),
                    body: githubReviewBody,
                    event: 'COMMENT'
                });
            } catch (err) {
                fastify.log.error(err, 'Failed to post review to GitHub');
            }

            // Sync PullRequest in DB
            let pullRequest = await prisma.pullRequest.findFirst({
                where: { repositoryId: repository.id, prNumber: parseInt(pullNumber) }
            });

            if (!pullRequest) {
                pullRequest = await prisma.pullRequest.create({
                    data: {
                        repositoryId: repository.id,
                        githubPrId: BigInt(pullData.id),
                        prNumber: pullData.number,
                        title: pullData.title,
                        description: pullData.body,
                        author: pullData.user?.login || 'unknown',
                        status: pullData.state === 'open' ? 'OPEN' : pullData.merged ? 'MERGED' : 'CLOSED',
                        baseBranch: pullData.base.ref,
                        headBranch: pullData.head.ref,
                        commitSha: pullData.head.sha,
                    }
                });
            }

            // Update with review status
            pullRequest = await prisma.pullRequest.update({
                where: { id: pullRequest.id },
                data: {
                    reviewStatus: 'COMPLETED',
                    riskScore: riskScore,
                    aiSummary: aiSummary,
                    reviewedAt: new Date()
                }
            });

            // Clear old review comments if this is a re-review
            await prisma.reviewComment.deleteMany({
                where: { pullRequestId: pullRequest.id }
            });

            // Save review comments
            for (const c of comments) {
                await prisma.reviewComment.create({
                    data: {
                        pullRequestId: pullRequest.id,
                        commentType: ['SUGGESTION', 'BUG', 'SECURITY', 'PERFORMANCE', 'STYLE'].includes(c.commentType) ? c.commentType : 'SUGGESTION',
                        severity: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(c.severity) ? c.severity : 'LOW',
                        message: c.message,
                        aiGenerated: true
                    }
                });
            }

            return reply.send({
                message: 'Review completed successfully',
                pullRequest: {
                    ...pullRequest,
                    githubPrId: pullRequest.githubPrId.toString()
                }
            });

        } catch (error: any) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Failed to process PR review' });
        }
    });

    fastify.get('/api/pulls/:id', async (request: FastifyRequest<{ Params: { id: string }; Querystring: { clerkId: string } }>, reply: FastifyReply) => {
        try {
            const { id } = request.params;
            const { clerkId } = request.query;

            if (!clerkId) {
                return reply.code(400).send({ error: 'clerkId is required' });
            }

            const user = await prisma.user.findUnique({
                where: { clerkId }
            });

            if (!user) {
                return reply.code(404).send({ error: 'User not found' });
            }

            const pullRequest = await prisma.pullRequest.findFirst({
                where: {
                    id,
                    repository: { userId: user.id }
                },
                include: {
                    repository: {
                        select: {
                            repoName: true,
                            repoFullName: true
                        }
                    },
                    reviewComments: true
                }
            });

            if (!pullRequest) {
                return reply.code(404).send({ error: 'Pull Request not found' });
            }

            return reply.send({
                ...pullRequest,
                githubPrId: pullRequest.githubPrId.toString(),
                reviewComments: pullRequest.reviewComments.map(c => ({
                    ...c,
                    githubCommentId: c.githubCommentId ? c.githubCommentId.toString() : null
                }))
            });
        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Internal server error' });
        }
    });
}
