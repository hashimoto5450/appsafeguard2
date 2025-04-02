import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Scan, User } from "@/types";
import { AppLayout } from "@/components/layout/app-layout";
import { ScanForm } from "@/components/scans/scan-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Search,
  PlusCircle, 
  ExternalLink, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Trash2,
  AlertTriangle
} from "lucide-react";

export default function ScansPage() {
  const [isNewScanOpen, setIsNewScanOpen] = useState(false);
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);
  const [scanToDelete, setScanToDelete] = useState<number | null>(null);
  const { toast } = useToast();
  
  // Fetch scans
  const { data: scans, isLoading } = useQuery<Scan[]>({
    queryKey: ["/api/scans"],
  });

  // Delete single scan mutation
  const deleteScanMutation = useMutation({
    mutationFn: async (scanId: number) => {
      await apiRequest("DELETE", `/api/scans/${scanId}`);
    },
    onSuccess: () => {
      // Invalidate scans query to refetch data
      queryClient.invalidateQueries({ queryKey: ["/api/scans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vulnerabilities/summary"] });
      
      toast({
        title: "スキャン削除完了",
        description: "スキャン結果が正常に削除されました",
        variant: "default",
      });
      
      setScanToDelete(null);
    },
    onError: (error) => {
      console.error("Error deleting scan:", error);
      toast({
        title: "削除エラー",
        description: "スキャン結果の削除中にエラーが発生しました",
        variant: "destructive",
      });
    }
  });
  
  // Delete all scans mutation
  const deleteAllScansMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/scans");
    },
    onSuccess: () => {
      // Invalidate scans query to refetch data
      queryClient.invalidateQueries({ queryKey: ["/api/scans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vulnerabilities/summary"] });
      
      toast({
        title: "全スキャン削除完了",
        description: "すべてのスキャン結果が正常に削除されました",
        variant: "default",
      });
      
      setIsDeleteAllOpen(false);
    },
    onError: (error) => {
      console.error("Error deleting all scans:", error);
      toast({
        title: "削除エラー",
        description: "スキャン結果の削除中にエラーが発生しました",
        variant: "destructive",
      });
    }
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
  
  // Action cell with delete button and details link
  const ActionCell = ({ scan }: { scan: Scan }) => {
    return (
      <div className="flex justify-end gap-2">
        <AlertDialog open={scanToDelete === scan.id} onOpenChange={(open) => !open && setScanToDelete(null)}>
          <AlertDialogTrigger asChild>
            <Button 
              size="sm" 
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => setScanToDelete(scan.id)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              削除
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>スキャン結果の削除</AlertDialogTitle>
              <AlertDialogDescription>
                このスキャン結果を削除しますか？この操作は元に戻せません。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteScanMutation.mutate(scan.id)}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                {deleteScanMutation.isPending && scanToDelete === scan.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    削除中...
                  </>
                ) : (
                  "削除する"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Link href={`/scans/${scan.id}`}>
          <Button size="sm" variant="outline">
            <ExternalLink className="h-4 w-4 mr-1" />
            詳細
          </Button>
        </Link>
      </div>
    );
  };

  return (
    <AppLayout title="スキャン管理">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">スキャン管理</h1>
          <div className="flex gap-2">
            <AlertDialog open={isDeleteAllOpen} onOpenChange={setIsDeleteAllOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                  <Trash2 className="h-4 w-4 mr-2" />
                  すべて削除
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>すべてのスキャン結果を削除</AlertDialogTitle>
                  <AlertDialogDescription>
                    すべてのスキャン結果と関連する脆弱性データを削除します。この操作は元に戻せません。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>キャンセル</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteAllScansMutation.mutate()}
                    className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                  >
                    {deleteAllScansMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        削除中...
                      </>
                    ) : (
                      "すべて削除する"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            <Dialog open={isNewScanOpen} onOpenChange={setIsNewScanOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  新規スキャン
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>新規スキャン</DialogTitle>
                  <DialogDescription>
                    スキャンするWebアプリケーションのURLと設定を入力してください。
                  </DialogDescription>
                </DialogHeader>
                <ScanForm />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="all" className="mb-6">
          <TabsList>
            <TabsTrigger value="all">すべて</TabsTrigger>
            <TabsTrigger value="running">実行中</TabsTrigger>
            <TabsTrigger value="completed">完了</TabsTrigger>
            <TabsTrigger value="failed">失敗</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">スキャン履歴</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>URL</TableHead>
                        <TableHead>スキャンレベル</TableHead>
                        <TableHead>ステータス</TableHead>
                        <TableHead>開始日時</TableHead>
                        <TableHead>完了日時</TableHead>
                        <TableHead className="text-right">アクション</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        Array(5).fill(0).map((_, i) => (
                          <TableRow key={i}>
                            <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-9 w-20 ml-auto" /></TableCell>
                          </TableRow>
                        ))
                      ) : scans && scans.length > 0 ? (
                        scans.map((scan) => (
                          <TableRow key={scan.id}>
                            <TableCell className="font-medium">{scan.url}</TableCell>
                            <TableCell>
                              {scan.scanLevel === "quick" && "クイック"}
                              {scan.scanLevel === "standard" && "標準"}
                              {scan.scanLevel === "detailed" && "詳細"}
                            </TableCell>
                            <TableCell>{getStatusBadge(scan.status)}</TableCell>
                            <TableCell>{formatDate(scan.startedAt)}</TableCell>
                            <TableCell>{formatDate(scan.completedAt)}</TableCell>
                            <TableCell className="text-right">
                              <ActionCell scan={scan} />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-6">
                            <div className="flex flex-col items-center justify-center text-gray-500">
                              <Search className="h-10 w-10 mb-2 opacity-20" />
                              <p>スキャン履歴がありません</p>
                              <p className="text-sm">新規スキャンを実行してください</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="running" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>URL</TableHead>
                        <TableHead>スキャンレベル</TableHead>
                        <TableHead>ステータス</TableHead>
                        <TableHead>開始日時</TableHead>
                        <TableHead className="text-right">アクション</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                          </TableCell>
                        </TableRow>
                      ) : scans && scans.filter(s => s.status === "running" || s.status === "pending").length > 0 ? (
                        scans
                          .filter(s => s.status === "running" || s.status === "pending")
                          .map((scan) => (
                            <TableRow key={scan.id}>
                              <TableCell className="font-medium">{scan.url}</TableCell>
                              <TableCell>
                                {scan.scanLevel === "quick" && "クイック"}
                                {scan.scanLevel === "standard" && "標準"}
                                {scan.scanLevel === "detailed" && "詳細"}
                              </TableCell>
                              <TableCell>{getStatusBadge(scan.status)}</TableCell>
                              <TableCell>{formatDate(scan.startedAt)}</TableCell>
                              <TableCell className="text-right">
                                <ActionCell scan={scan} />
                              </TableCell>
                            </TableRow>
                          ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-6">
                            <p className="text-gray-500">実行中のスキャンはありません</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="completed" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>URL</TableHead>
                        <TableHead>検出された脆弱性</TableHead>
                        <TableHead>開始日時</TableHead>
                        <TableHead>完了日時</TableHead>
                        <TableHead className="text-right">アクション</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                          </TableCell>
                        </TableRow>
                      ) : scans && scans.filter(s => s.status === "completed").length > 0 ? (
                        scans
                          .filter(s => s.status === "completed")
                          .map((scan) => (
                            <TableRow key={scan.id}>
                              <TableCell className="font-medium">{scan.url}</TableCell>
                              <TableCell>
                                {scan.result?.totalVulnerabilities || 0}
                                {scan.result && (
                                  <span className="text-xs ml-2">
                                    (高: {scan.result.highSeverity}, 中: {scan.result.mediumSeverity}, 低: {scan.result.lowSeverity})
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>{formatDate(scan.startedAt)}</TableCell>
                              <TableCell>{formatDate(scan.completedAt)}</TableCell>
                              <TableCell className="text-right">
                                <ActionCell scan={scan} />
                              </TableCell>
                            </TableRow>
                          ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-6">
                            <p className="text-gray-500">完了したスキャンはありません</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="failed" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>URL</TableHead>
                        <TableHead>スキャンレベル</TableHead>
                        <TableHead>開始日時</TableHead>
                        <TableHead>エラー詳細</TableHead>
                        <TableHead className="text-right">アクション</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                          </TableCell>
                        </TableRow>
                      ) : scans && scans.filter(s => s.status === "failed").length > 0 ? (
                        scans
                          .filter(s => s.status === "failed")
                          .map((scan) => (
                            <TableRow key={scan.id}>
                              <TableCell className="font-medium">{scan.url}</TableCell>
                              <TableCell>
                                {scan.scanLevel === "quick" && "クイック"}
                                {scan.scanLevel === "standard" && "標準"}
                                {scan.scanLevel === "detailed" && "詳細"}
                              </TableCell>
                              <TableCell>{formatDate(scan.startedAt)}</TableCell>
                              <TableCell>
                                {scan.result?.error || "不明なエラー"}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <AlertDialog open={scanToDelete === scan.id} onOpenChange={(open) => !open && setScanToDelete(null)}>
                                    <AlertDialogTrigger asChild>
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        className="text-red-600 border-red-200 hover:bg-red-50"
                                        onClick={() => setScanToDelete(scan.id)}
                                      >
                                        <Trash2 className="h-4 w-4 mr-1" />
                                        削除
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>スキャン結果の削除</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          このスキャン結果を削除しますか？この操作は元に戻せません。
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => deleteScanMutation.mutate(scan.id)}
                                          className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                                        >
                                          {deleteScanMutation.isPending && scanToDelete === scan.id ? (
                                            <>
                                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                              削除中...
                                            </>
                                          ) : (
                                            "削除する"
                                          )}
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                  <Button size="sm" variant="outline">
                                    再実行
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-6">
                            <p className="text-gray-500">失敗したスキャンはありません</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}