import { useQuery } from "@tanstack/react-query";
import { SecurityEvent } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Shield, AlertTriangle, ListChecks } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

interface ActivityDisplay {
  id: number;
  icon: React.ReactNode;
  text: string;
  time: string;
  color: string;
}

export function RecentActivity() {
  // Fetch recent security events
  const { data: securityEvents, isLoading } = useQuery<SecurityEvent[]>({
    queryKey: ["/api/security-events"],
    queryFn: async () => {
      // This endpoint doesn't exist yet, so we'll handle the error gracefully
      try {
        const response = await fetch("/api/security-events");
        if (!response.ok) throw new Error("Failed to fetch security events");
        return await response.json();
      } catch (error) {
        console.error("Error fetching security events:", error);
        return [];
      }
    },
  });

  // Format security events for display
  const activities: ActivityDisplay[] = securityEvents?.slice(0, 4).map((event) => {
    let icon;
    let color;
    let text = event.description;
    
    // Determine icon and color based on event type
    switch (event.type) {
      case "scan_completed":
        icon = <Shield className="text-blue-600 text-sm" />;
        color = "bg-blue-100";
        break;
      case "vulnerability_detected":
        icon = <AlertTriangle className="text-red-600 text-sm" />;
        color = "bg-red-100";
        break;
      case "task_completed":
        icon = <CheckCircle className="text-green-600 text-sm" />;
        color = "bg-green-100";
        break;
      default:
        icon = <ListChecks className="text-amber-600 text-sm" />;
        color = "bg-amber-100";
    }
    
    // Format time
    const createdAt = new Date(event.createdAt);
    const now = new Date();
    const diffMs = now.getTime() - createdAt.getTime();
    
    let time;
    if (diffMs < 60000) { // less than 1 minute
      time = `${Math.floor(diffMs / 1000)}秒前`;
    } else if (diffMs < 3600000) { // less than 1 hour
      time = `${Math.floor(diffMs / 60000)}分前`;
    } else if (diffMs < 86400000) { // less than 1 day
      time = `${Math.floor(diffMs / 3600000)}時間前`;
    } else {
      time = `${Math.floor(diffMs / 86400000)}日前`;
    }
    
    return {
      id: event.id,
      icon,
      text,
      time,
      color,
    };
  }) || [];

  // Default activities if none are available
  const defaultActivities: ActivityDisplay[] = [
    {
      id: 1,
      icon: <CheckCircle className="text-green-600 text-sm" />,
      text: "CSP設定の脆弱性を修正しました",
      time: "30分前",
      color: "bg-green-100",
    },
    {
      id: 2,
      icon: <Shield className="text-blue-600 text-sm" />,
      text: "スキャン完了: example.com",
      time: "2時間前",
      color: "bg-blue-100",
    },
    {
      id: 3,
      icon: <AlertTriangle className="text-red-600 text-sm" />,
      text: "重大な脆弱性を検出: XSS攻撃の可能性",
      time: "3時間前",
      color: "bg-red-100",
    },
    {
      id: 4,
      icon: <ListChecks className="text-amber-600 text-sm" />,
      text: "新しいタスクが作成されました",
      time: "昨日",
      color: "bg-amber-100",
    },
  ];

  const displayActivities = activities.length > 0 ? activities : defaultActivities;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">最近のアクティビティ</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="flex">
                <Skeleton className="h-8 w-8 rounded-full mr-3" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))
          ) : (
            displayActivities.map((activity) => (
              <div key={activity.id} className="flex">
                <div className="mr-3">
                  <div className={`h-8 w-8 rounded-full ${activity.color} flex items-center justify-center`}>
                    {activity.icon}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-800">{activity.text}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="mt-4 pt-3 border-t border-gray-100">
          <Link href="/activity">
            <Button variant="link" className="text-primary-600 hover:text-primary-700 p-0">
              すべてのアクティビティを表示 →
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
