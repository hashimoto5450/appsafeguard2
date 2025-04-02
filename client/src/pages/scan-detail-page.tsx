import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Scan, Vulnerability } from "@/types";
import { AppLayout } from "@/components/layout/app-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import { 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  ExternalLink, 
  FileText, 
  Loader2, 
  Shield, 
  ShieldAlert, 
  TerminalSquare, 
  XCircle
} from "lucide-react";
import { ScanReportPdf } from "@/components/pdf/scan-report-pdf";

export default function ScanDetailPage() {
  // Get scan ID from route
  const [, params] = useRoute<{ id: string }>("/scans/:id");
  const scanId = params?.id;

  // Fetch scan data
  const { data: scan, isLoading: isScanLoading } = useQuery<Scan>({
    queryKey: [`/api/scans/${scanId}`],
    enabled: !!scanId,
  });

  // Fetch vulnerabilities for this scan
  const { data: vulnerabilities, isLoading: isVulnerabilitiesLoading } = useQuery<Vulnerability[]>({
    queryKey: [`/api/scans/${scanId}/vulnerabilities`],
    enabled: !!scanId,
  });

  // Format date
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

  // Get severity badge
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "high":
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">高</Badge>;
      case "medium":
        return <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">中</Badge>;
      case "low":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">低</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  // Calculate security score
  const calculateSecurityScore = () => {
    if (!vulnerabilities) return 0;
    
    // Use securityScore if it exists in the result
    if (scan?.result?.securityScore !== undefined && scan.result.securityScore !== null) {
      return Math.round(scan.result.securityScore);
    }
    
    // Otherwise calculate it based on vulnerabilities
    // Calculate score based on number and severity of vulnerabilities
    const highWeight = 10;
    const mediumWeight = 5;
    const lowWeight = 2;
    
    const highSeverity = vulnerabilities.filter(v => v.severity === "high").length;
    const mediumSeverity = vulnerabilities.filter(v => v.severity === "medium").length;
    const lowSeverity = vulnerabilities.filter(v => v.severity === "low").length;
    
    const totalVulnWeight = 
      highSeverity * highWeight + 
      mediumSeverity * mediumWeight + 
      lowSeverity * lowWeight;
    
    if (totalVulnWeight === 0) return 100;
    
    // Max penalty of 100 points
    const maxPenalty = 100;
    // Start with perfect score and subtract based on vulnerabilities
    const score = Math.max(0, 100 - Math.min(maxPenalty, totalVulnWeight));
    
    return Math.round(score);
  };

  const securityScore = calculateSecurityScore();
  const isLoading = isScanLoading || isVulnerabilitiesLoading;

  if (isLoading) {
    return (
      <AppLayout title="スキャン詳細">
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center gap-2 mb-6">
            <Link href="/scans">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                戻る
              </Button>
            </Link>
            <Skeleton className="h-9 w-64" />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
          
          <Skeleton className="h-[400px] w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!scan) {
    return (
      <AppLayout title="スキャン詳細">
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center gap-2 mb-6">
            <Link href="/scans">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                戻る
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">スキャン詳細</h1>
          </div>
          
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>スキャンが見つかりません</AlertTitle>
            <AlertDescription>
              指定されたIDのスキャンは存在しないか、アクセス権限がありません。
            </AlertDescription>
          </Alert>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={`スキャン詳細: ${scan.url}`}>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Link href="/scans">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                戻る
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">スキャン詳細</h1>
          </div>
          
          <div className="flex items-center gap-2">
            {scan.status === "completed" && (
              <>
                <Link href={`/reports/new?scanId=${scan.id}`}>
                  <Button variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    レポート作成
                  </Button>
                </Link>
                <Link href={`#pdf-report`}>
                  <Button variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    PDF出力
                  </Button>
                </Link>
              </>
            )}
            <Button variant="outline">
              <ExternalLink className="h-4 w-4 mr-2" />
              URLを開く
            </Button>
          </div>
        </div>
        
        {/* Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          {/* URL Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">URL</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold truncate" title={scan.url}>
                {scan.url}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                スキャンレベル: {
                  scan.scanLevel === "quick" ? "クイック" :
                  scan.scanLevel === "standard" ? "標準" :
                  scan.scanLevel === "detailed" ? "詳細" : scan.scanLevel
                }
              </p>
              <p className="text-sm text-muted-foreground">
                クロール制限: {scan.crawlLimit || "N/A"}
              </p>
            </CardContent>
          </Card>
          
          {/* Status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">ステータス</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  {getStatusBadge(scan.status)}
                  <span className="text-lg font-semibold">
                    {
                      scan.status === "pending" ? "待機中" :
                      scan.status === "running" ? "実行中" :
                      scan.status === "completed" ? "完了" :
                      scan.status === "failed" ? "失敗" : scan.status
                    }
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">開始: {formatDate(scan.startedAt)}</p>
                <p className="text-sm text-muted-foreground">完了: {formatDate(scan.completedAt)}</p>
                {scan.result?.error && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertTitle>エラー</AlertTitle>
                    <AlertDescription>{scan.result.error}</AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Security Score */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">セキュリティスコア</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                <div className={`text-4xl font-bold ${
                  securityScore >= 80 ? "text-green-500" :
                  securityScore >= 60 ? "text-yellow-500" :
                  "text-red-500"
                }`}>
                  {securityScore}
                </div>
                <Progress 
                  className="w-full h-2 mt-2" 
                  value={securityScore} 
                  color={
                    securityScore >= 80 ? "bg-green-500" :
                    securityScore >= 60 ? "bg-yellow-500" :
                    "bg-red-500"
                  }
                />
                <div className="flex justify-between w-full mt-1">
                  <span className="text-xs text-red-500">危険</span>
                  <span className="text-xs text-green-500">安全</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Vulnerabilities Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">脆弱性概要</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {vulnerabilities ? vulnerabilities.length : 0}
                <span className="text-base font-normal text-muted-foreground ml-2">検出</span>
              </div>
              
              <div className="grid grid-cols-4 gap-2 mt-4">
                <div className="flex flex-col items-center">
                  <div className="text-lg font-bold text-red-500">
                    {(vulnerabilities || []).filter(v => v.severity === "high").length}
                  </div>
                  <div className="text-xs text-muted-foreground">高リスク</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-lg font-bold text-orange-500">
                    {(vulnerabilities || []).filter(v => v.severity === "medium").length}
                  </div>
                  <div className="text-xs text-muted-foreground">中リスク</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-lg font-bold text-yellow-500">
                    {(vulnerabilities || []).filter(v => v.severity === "low").length}
                  </div>
                  <div className="text-xs text-muted-foreground">低リスク</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-lg font-bold text-green-500">
                    {(vulnerabilities || []).filter(v => v.severity === "safe" || v.status === "safe").length}
                  </div>
                  <div className="text-xs text-muted-foreground">安全</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Vulnerabilities Table */}
        <Tabs defaultValue="all" className="mt-6">
          <TabsList>
            <TabsTrigger value="all">すべて</TabsTrigger>
            <TabsTrigger value="high">高リスク</TabsTrigger>
            <TabsTrigger value="medium">中リスク</TabsTrigger>
            <TabsTrigger value="low">低リスク</TabsTrigger>
            <TabsTrigger value="safe">安全</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-4">
            <VulnerabilitiesTable vulnerabilities={vulnerabilities || []} />
          </TabsContent>
          
          <TabsContent value="high" className="mt-4">
            <VulnerabilitiesTable 
              vulnerabilities={(vulnerabilities || []).filter(v => v.severity === "high")} 
              emptyMessage="高リスクの脆弱性は検出されませんでした。"
            />
          </TabsContent>
          
          <TabsContent value="medium" className="mt-4">
            <VulnerabilitiesTable 
              vulnerabilities={(vulnerabilities || []).filter(v => v.severity === "medium")} 
              emptyMessage="中リスクの脆弱性は検出されませんでした。"
            />
          </TabsContent>
          
          <TabsContent value="low" className="mt-4">
            <VulnerabilitiesTable 
              vulnerabilities={(vulnerabilities || []).filter(v => v.severity === "low")} 
              emptyMessage="低リスクの脆弱性は検出されませんでした。"
            />
          </TabsContent>

          <TabsContent value="safe" className="mt-4">
            <VulnerabilitiesTable 
              vulnerabilities={(vulnerabilities || []).filter(v => v.severity === "safe" || v.status === "safe")} 
              emptyMessage="安全な項目は検出されませんでした。"
            />
          </TabsContent>
        </Tabs>

        {/* PDF Report Section */}
        {scan.status === "completed" && (
          <div id="pdf-report" className="mt-12">
            <div className="border-t pt-6">
              <h2 className="text-2xl font-bold mb-4">PDFレポート</h2>
              <p className="text-muted-foreground mb-4">
                スキャン結果の詳細をPDFレポートとしてダウンロードできます。
                レポートには脆弱性の詳細情報やセキュリティスコア、推奨される対策などが含まれます。
              </p>
              <ScanReportPdf scan={scan} vulnerabilities={vulnerabilities || []} />
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

interface VulnerabilitiesTableProps {
  vulnerabilities: Vulnerability[];
  emptyMessage?: string;
}

function VulnerabilitiesTable({ vulnerabilities, emptyMessage = "脆弱性は検出されませんでした。" }: VulnerabilitiesTableProps) {
  // Get severity badge
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "high":
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">高</Badge>;
      case "medium":
        return <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">中</Badge>;
      case "low":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">低</Badge>;
      case "safe":
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">安全</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>脆弱性名</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>重要度</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead className="text-right">アクション</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vulnerabilities.length > 0 ? (
                vulnerabilities.map((vuln) => (
                  <TableRow key={vuln.id}>
                    <TableCell className="font-medium">{vuln.name}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={vuln.url}>
                      {vuln.url}
                    </TableCell>
                    <TableCell>{getSeverityBadge(vuln.severity)}</TableCell>
                    <TableCell>
                      {vuln.status === "open" ? (
                        <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">未対応</Badge>
                      ) : vuln.status === "in_progress" ? (
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">対応中</Badge>
                      ) : vuln.status === "fixed" ? (
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">修正済</Badge>
                      ) : vuln.status === "safe" ? (
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">安全</Badge>
                      ) : (
                        <Badge variant="outline">{vuln.status}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/vulnerabilities/${vuln.id}`}>
                        <Button size="sm" variant="outline">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          詳細
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <ShieldAlert className="h-10 w-10 mb-2 text-muted-foreground/40" />
                      <p>{emptyMessage}</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}