import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Vulnerability } from "@/types";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Bug, FileText, Loader2, Search } from "lucide-react";
import { Link } from "wouter";

export default function VulnerabilitiesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Fetch vulnerabilities
  const { data: vulnerabilities, isLoading } = useQuery<Vulnerability[]>({
    queryKey: ["/api/vulnerabilities"],
  });

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

  // Filter vulnerabilities based on search query, severity, and status
  const filteredVulnerabilities = vulnerabilities?.filter((vuln) => {
    const matchesSearch = searchQuery === "" || 
      vuln.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      vuln.url.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSeverity = severityFilter === "all" || vuln.severity === severityFilter;
    const matchesStatus = statusFilter === "all" || vuln.status === statusFilter;
    
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  return (
    <AppLayout title="脆弱性">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">脆弱性管理</h1>
          <Link href="/reports">
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              レポート作成
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <div className="bg-red-100 p-3 rounded-full">
                  <Bug className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">高重大度</p>
                  <p className="text-2xl font-semibold">
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin inline-block" />
                    ) : (
                      vulnerabilities?.filter(v => v.severity === "high").length || 0
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <div className="bg-orange-100 p-3 rounded-full">
                  <Bug className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">中重大度</p>
                  <p className="text-2xl font-semibold">
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin inline-block" />
                    ) : (
                      vulnerabilities?.filter(v => v.severity === "medium").length || 0
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <div className="bg-yellow-100 p-3 rounded-full">
                  <Bug className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">低重大度</p>
                  <p className="text-2xl font-semibold">
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin inline-block" />
                    ) : (
                      vulnerabilities?.filter(v => v.severity === "low").length || 0
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <div className="bg-green-100 p-3 rounded-full">
                  <Bug className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">解決済み</p>
                  <p className="text-2xl font-semibold">
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin inline-block" />
                    ) : (
                      vulnerabilities?.filter(v => v.status === "fixed").length || 0
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">脆弱性一覧</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="脆弱性またはURLで検索..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="重大度" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべての重大度</SelectItem>
                    <SelectItem value="high">高</SelectItem>
                    <SelectItem value="medium">中</SelectItem>
                    <SelectItem value="low">低</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="ステータス" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべてのステータス</SelectItem>
                    <SelectItem value="pending">未対応</SelectItem>
                    <SelectItem value="in_progress">対応中</SelectItem>
                    <SelectItem value="fixed">解決済み</SelectItem>
                    <SelectItem value="false_positive">誤検出</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">脆弱性</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>重大度</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead>検出日時</TableHead>
                    <TableHead className="text-right">アクション</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array(5).fill(0).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={6} className="text-center">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredVulnerabilities && filteredVulnerabilities.length > 0 ? (
                    filteredVulnerabilities.map((vuln) => (
                      <TableRow key={vuln.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <Bug className={`mr-2 h-5 w-5 ${
                              vuln.severity === "high" ? "text-red-500" :
                              vuln.severity === "medium" ? "text-orange-500" : "text-yellow-500"
                            }`} />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{vuln.name}</div>
                              <div className="text-xs text-gray-500">{vuln.category}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-900 truncate max-w-[250px]">{vuln.url}</div>
                        </TableCell>
                        <TableCell>
                          {getSeverityBadge(vuln.severity)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(vuln.status)}
                        </TableCell>
                        <TableCell>
                          {new Date(vuln.createdAt).toLocaleString("ja-JP")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/vulnerabilities/${vuln.id}`}>
                            <Button size="sm" variant="outline">
                              詳細
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <Search className="h-10 w-10 mb-2 opacity-20" />
                          <p>検索条件に一致する脆弱性はありません</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
