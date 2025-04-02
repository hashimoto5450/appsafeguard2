import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Scan } from "@/types";

interface ScansCardProps {
  latestScans: Scan[] | undefined;
  isLoading: boolean;
}

export function ScansCard({ latestScans, isLoading }: ScansCardProps) {
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("ja-JP");
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="flex items-center gap-1"><Clock className="h-3 w-3" /> 待機中</Badge>;
      case "running":
        return <Badge variant="outline" className="flex items-center gap-1 text-blue-800 bg-blue-100 border-blue-200"><Loader2 className="h-3 w-3 animate-spin" /> 実行中</Badge>;
      case "completed":
        return <Badge variant="outline" className="flex items-center gap-1 text-green-800 bg-green-100 border-green-200"><CheckCircle className="h-3 w-3" /> 完了</Badge>;
      case "failed":
        return <Badge variant="outline" className="flex items-center gap-1 text-red-800 bg-red-100 border-red-200"><XCircle className="h-3 w-3" /> 失敗</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">最近のスキャン</CardTitle>
        <CardDescription>直近に実行されたセキュリティスキャン</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ) : latestScans && latestScans.length > 0 ? (
          <div className="space-y-4">
            {latestScans.slice(0, 3).map((scan) => (
              <div key={scan.id} className="border rounded-md p-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium truncate max-w-[200px]">{scan.url}</div>
                  {getStatusBadge(scan.status)}
                </div>
                
                <div className="text-sm text-muted-foreground mb-2">
                  スキャン日時: {formatDate(scan.startedAt)}
                </div>
                
                {scan.result && (
                  <div className="text-sm mb-3">
                    <span className="font-medium">検出された脆弱性: </span>
                    <span className="text-red-600 font-medium">{scan.result.highSeverity}</span> 高 / 
                    <span className="text-amber-600 font-medium"> {scan.result.mediumSeverity}</span> 中 / 
                    <span className="text-blue-600 font-medium"> {scan.result.lowSeverity}</span> 低
                  </div>
                )}
                
                <Link href={`/scans/${scan.id}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    詳細を表示
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            スキャン履歴がありません
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Link href="/scans">
          <Button variant="outline" className="w-full">
            すべてのスキャンを表示
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}