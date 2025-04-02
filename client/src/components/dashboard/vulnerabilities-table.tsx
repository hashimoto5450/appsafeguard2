import { useQuery } from "@tanstack/react-query";
import { Vulnerability, Scan } from "@/types";
import { Link } from "wouter";
import { Bug } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export function VulnerabilitiesTable() {
  // Fetch recent scans
  const { data: scans, isLoading: isLoadingScans } = useQuery<Scan[]>({
    queryKey: ["/api/scans"],
  });
  
  // Get the most recent scan
  const latestScan = scans && scans.length > 0 ? scans[0] : null;
  
  // Fetch vulnerabilities for the latest scan if available
  const { data: vulnerabilities, isLoading: isLoadingVulnerabilities } = useQuery<Vulnerability[]>({
    queryKey: ["/api/scans", latestScan?.id, "vulnerabilities"],
    enabled: !!latestScan?.id,
  });
  
  // Loading state for either data fetch
  const isLoading = isLoadingScans || isLoadingVulnerabilities;

  // Get severity badge styling
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "high":
        return <Badge variant="destructive">高</Badge>;
      case "medium":
        return <Badge className="bg-orange-500">中</Badge>;
      case "low":
        return <Badge className="bg-yellow-500">低</Badge>;
      default:
        return <Badge>不明</Badge>;
    }
  };

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-yellow-800 bg-yellow-100 border-yellow-200">未対応</Badge>;
      case "in_progress":
        return <Badge variant="outline" className="text-blue-800 bg-blue-100 border-blue-200">対応中</Badge>;
      case "fixed":
        return <Badge variant="outline" className="text-green-800 bg-green-100 border-green-200">解決済み</Badge>;
      case "false_positive":
        return <Badge variant="outline" className="text-gray-800 bg-gray-100 border-gray-200">誤検出</Badge>;
      default:
        return <Badge variant="outline">不明</Badge>;
    }
  };

  // Get icon color based on severity
  const getIconColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "text-red-500";
      case "medium":
        return "text-orange-500";
      case "low":
        return "text-yellow-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-[300px]">脆弱性</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>重大度</TableHead>
              <TableHead>ステータス</TableHead>
              <TableHead className="text-right">アクション</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center">
                      <Skeleton className="h-5 w-5 mr-2" />
                      <div>
                        <Skeleton className="h-4 w-40 mb-1" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-10 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : vulnerabilities && vulnerabilities.length > 0 ? (
              vulnerabilities.slice(0, 3).map((vuln) => (
                <TableRow key={vuln.id}>
                  <TableCell>
                    <div className="flex items-center">
                      <Bug className={`mr-2 h-5 w-5 ${getIconColor(vuln.severity)}`} />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{vuln.name}</div>
                        <div className="text-xs text-gray-500">{vuln.category}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-900 truncate max-w-[300px]">{vuln.url}</div>
                  </TableCell>
                  <TableCell>
                    {getSeverityBadge(vuln.severity)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(vuln.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/vulnerabilities/${vuln.id}`}>
                      <a className="text-primary-600 hover:text-primary-900 text-sm font-medium">詳細</a>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <Bug className="h-10 w-10 mb-2 opacity-20" />
                    {latestScan ? (
                      <>
                        <p>最新のスキャン（{latestScan.url}）では脆弱性が検出されませんでした</p>
                        <p className="text-sm">別のサイトをスキャンしてみてください</p>
                      </>
                    ) : (
                      <>
                        <p>脆弱性はまだ検出されていません</p>
                        <p className="text-sm">スキャンを実行して脆弱性を検出してください</p>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
