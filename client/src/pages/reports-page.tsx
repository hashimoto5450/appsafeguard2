import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Report } from "@/types";
import { AppLayout } from "@/components/layout/app-layout";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Download, FileText, Loader2, PlusCircle } from "lucide-react";
import { Link } from "wouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define form schema for creating a new report
const newReportSchema = z.object({
  title: z.string().min(3, "タイトルは3文字以上で入力してください").max(100, "タイトルは100文字以内で入力してください"),
  type: z.enum(["vulnerability", "task", "security"]),
  format: z.enum(["pdf", "json", "csv"]).default("pdf"),
});

export default function ReportsPage() {
  const [isNewReportOpen, setIsNewReportOpen] = useState(false);
  const { toast } = useToast();
  
  // Fetch reports
  const { data: reports, isLoading } = useQuery<Report[]>({
    queryKey: ["/api/reports"],
  });

  // Form for new report
  const form = useForm<z.infer<typeof newReportSchema>>({
    resolver: zodResolver(newReportSchema),
    defaultValues: {
      title: "",
      type: "vulnerability",
      format: "pdf",
    },
  });

  // Create report mutation
  const createReportMutation = useMutation({
    mutationFn: async (values: z.infer<typeof newReportSchema>) => {
      const res = await apiRequest("POST", "/api/reports", values);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "レポートが生成されました",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      form.reset();
      setIsNewReportOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "レポートの生成に失敗しました",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: z.infer<typeof newReportSchema>) => {
    createReportMutation.mutate(values);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("ja-JP");
  };

  // Get report type badge
  const getReportTypeBadge = (type: string) => {
    switch (type) {
      case "vulnerability":
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">脆弱性</Badge>;
      case "task":
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">タスク</Badge>;
      case "security":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">セキュリティ</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  // Get report format badge
  const getReportFormatBadge = (format: string) => {
    switch (format) {
      case "pdf":
        return <Badge variant="outline" className="bg-gray-100">PDF</Badge>;
      case "json":
        return <Badge variant="outline" className="bg-yellow-100">JSON</Badge>;
      case "csv":
        return <Badge variant="outline" className="bg-green-100">CSV</Badge>;
      default:
        return <Badge variant="outline">{format}</Badge>;
    }
  };

  return (
    <AppLayout title="レポート">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">レポート管理</h1>
          <Dialog open={isNewReportOpen} onOpenChange={setIsNewReportOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                新規レポート
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>レポート生成</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>レポートタイトル</FormLabel>
                        <FormControl>
                          <Input placeholder="レポートタイトルを入力" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>レポートタイプ</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="レポートタイプを選択" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="vulnerability">脆弱性レポート</SelectItem>
                            <SelectItem value="task">タスク進捗レポート</SelectItem>
                            <SelectItem value="security">総合セキュリティレポート</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="format"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>レポート形式</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="レポート形式を選択" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pdf">PDF</SelectItem>
                            <SelectItem value="json">JSON</SelectItem>
                            <SelectItem value="csv">CSV</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2 pt-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsNewReportOpen(false)}
                    >
                      キャンセル
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createReportMutation.isPending}
                    >
                      {createReportMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          生成中...
                        </>
                      ) : (
                        "レポート生成"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">レポート一覧</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>タイトル</TableHead>
                    <TableHead>タイプ</TableHead>
                    <TableHead>形式</TableHead>
                    <TableHead>生成日時</TableHead>
                    <TableHead className="text-right">アクション</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array(5).fill(0).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={5} className="text-center">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : reports && reports.length > 0 ? (
                    reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <FileText className="mr-2 h-5 w-5 text-primary" />
                            <div className="text-sm font-medium text-gray-900">{report.title}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getReportTypeBadge(report.type)}
                        </TableCell>
                        <TableCell>
                          {getReportFormatBadge(report.format)}
                        </TableCell>
                        <TableCell>
                          {formatDate(report.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Link href={`/reports/${report.id}`}>
                              <Button size="sm" variant="outline">
                                表示
                              </Button>
                            </Link>
                            <Button size="sm" variant="outline">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <FileText className="h-10 w-10 mb-2 opacity-20" />
                          <p>レポートはまだありません</p>
                          <p className="text-sm">「新規レポート」ボタンでレポートを生成してください</p>
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
