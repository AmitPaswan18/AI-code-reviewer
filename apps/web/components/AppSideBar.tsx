"use client";

import { cn } from "@/lib/utils";
import { LayoutDashboard, Settings, Zap } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/repos", label: "Repositories", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-56 bg-sidebar-background border-r border-sidebar-border flex flex-col z-30">
      <div className="p-4 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sm text-foreground tracking-tight">
            CodeLens AI
          </span>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
              )}>
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-medium text-secondary-foreground">
            AC
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">
              acme-org
            </p>
            <p className="text-[10px] text-muted-foreground">Free plan</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
