import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  BarChart3,
  Bug,
  ChevronLeft,
  FileText,
  Menu,
  SearchCode,
  Settings,
  Shield,
  CheckSquare,
  PieChart,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SideNavigationProps {
  className?: string;
}

export function SideNavigation({ className }: SideNavigationProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const navItems = [
    {
      title: "メイン",
      links: [
        {
          href: "/",
          label: "ダッシュボード",
          icon: <BarChart3 className="h-5 w-5" />,
        },
        {
          href: "/scans",
          label: "スキャン管理",
          icon: <SearchCode className="h-5 w-5" />,
        },
        {
          href: "/vulnerabilities",
          label: "脆弱性",
          icon: <Bug className="h-5 w-5" />,
        },
        {
          href: "/tasks",
          label: "修正タスク",
          icon: <CheckSquare className="h-5 w-5" />,
        },
        {
          href: "/metrics",
          label: "セキュリティメトリクス",
          icon: <PieChart className="h-5 w-5" />,
        },
      ],
    },
    {
      title: "管理",
      links: [
        {
          href: "/rules",
          label: "カスタムルール",
          icon: <Shield className="h-5 w-5" />,
        },
        {
          href: "/reports",
          label: "レポート",
          icon: <FileText className="h-5 w-5" />,
        },
        {
          href: "/settings",
          label: "設定",
          icon: <Settings className="h-5 w-5" />,
        },
      ],
    },
  ];

  return (
    <div
      className={cn(
        "flex flex-col h-full border-r bg-white transition-all duration-300",
        isCollapsed ? "w-[4.5rem]" : "w-64",
        className
      )}
    >
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center">
          <Shield className="h-8 w-8 text-primary mr-2" />
          {!isCollapsed && (
            <h1 className="text-xl font-semibold text-gray-800">AppSafeguard</h1>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? "Expand" : "Collapse"}
        >
          {isCollapsed ? (
            <Menu className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </Button>
      </div>
      
      <div className="px-2 py-4 flex-1 overflow-y-auto scrollbar-thin">
        {navItems.map((section, i) => (
          <div key={i} className="mb-4">
            {!isCollapsed && (
              <p className="text-xs text-gray-500 px-3 mb-2 uppercase">{section.title}</p>
            )}
            <ul>
              {section.links.map((link, j) => (
                <li key={j} className="mb-1">
                  <Link href={link.href}>
                    <a
                      className={cn(
                        "flex items-center px-3 py-2 text-sm rounded-md transition-colors",
                        isCollapsed ? "justify-center" : "",
                        location === link.href
                          ? "bg-primary-50 text-primary-700 font-medium"
                          : "text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      <span className={cn("text-xl", isCollapsed ? "" : "mr-2")}>
                        {link.icon}
                      </span>
                      {!isCollapsed && link.label}
                    </a>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center">
          <Avatar className="h-8 w-8 mr-2">
            <AvatarImage src="" />
            <AvatarFallback className="bg-primary-100 text-primary-700">
              {user?.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">
                {user?.username}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className={cn(isCollapsed ? "ml-0" : "ml-auto")}
            aria-label="Logout"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5 text-gray-500"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
}
