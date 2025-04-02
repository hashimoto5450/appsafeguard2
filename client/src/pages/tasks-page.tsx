import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Task } from "@/types";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CheckSquare, Clock, ListChecks, Loader2, PlusCircle, Search, XCircle } from "lucide-react";
import { Link } from "wouter";

// Define form schema for creating a new task
const newTaskSchema = z.object({
  title: z.string().min(3, "タイトルは3文字以上で入力してください").max(100, "タイトルは100文字以内で入力してください"),
  description: z.string().min(3, "説明は3文字以上で入力してください").max(1000, "説明は1000文字以内で入力してください"),
  status: z.enum(["pending", "in_progress", "completed", "deferred"]),
});

export default function TasksPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const { toast } = useToast();
  
  // Fetch tasks
  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  // Form for new task
  const form = useForm<z.infer<typeof newTaskSchema>>({
    resolver: zodResolver(newTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "pending",
    },
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (values: z.infer<typeof newTaskSchema>) => {
      const res = await apiRequest("POST", "/api/tasks", values);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "タスクが作成されました",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      form.reset();
      setIsNewTaskOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "タスクの作成に失敗しました",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: z.infer<typeof newTaskSchema>) => {
    createTaskMutation.mutate(values);
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="flex items-center gap-1"><Clock className="h-3 w-3" /> 未着手</Badge>;
      case "in_progress":
        return <Badge variant="outline" className="flex items-center gap-1 text-blue-800 bg-blue-100 border-blue-200"><Loader2 className="h-3 w-3" /> 対応中</Badge>;
      case "completed":
        return <Badge variant="outline" className="flex items-center gap-1 text-green-800 bg-green-100 border-green-200"><CheckSquare className="h-3 w-3" /> 完了</Badge>;
      case "deferred":
        return <Badge variant="outline" className="flex items-center gap-1 text-yellow-800 bg-yellow-100 border-yellow-200"><XCircle className="h-3 w-3" /> 延期</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Format date
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "未設定";
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP");
  };

  // Filter tasks based on search query and status
  const filteredTasks = tasks?.filter((task) => {
    const matchesSearch = searchQuery === "" || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      task.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <AppLayout title="修正タスク">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">修正タスク管理</h1>
          <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                新規タスク
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>新規タスク作成</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>タスクタイトル</FormLabel>
                        <FormControl>
                          <Input placeholder="タスクタイトルを入力" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>タスクの説明</FormLabel>
                        <FormControl>
                          <Textarea placeholder="タスクの詳細を入力" rows={4} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ステータス</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="ステータスを選択" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pending">未着手</SelectItem>
                            <SelectItem value="in_progress">対応中</SelectItem>
                            <SelectItem value="completed">完了</SelectItem>
                            <SelectItem value="deferred">延期</SelectItem>
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
                      onClick={() => setIsNewTaskOpen(false)}
                    >
                      キャンセル
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createTaskMutation.isPending}
                    >
                      {createTaskMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          作成中...
                        </>
                      ) : (
                        "タスク作成"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <div className="bg-gray-100 p-3 rounded-full">
                  <Clock className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">未着手</p>
                  <p className="text-2xl font-semibold">
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin inline-block" />
                    ) : (
                      tasks?.filter(t => t.status === "pending").length || 0
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Loader2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">対応中</p>
                  <p className="text-2xl font-semibold">
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin inline-block" />
                    ) : (
                      tasks?.filter(t => t.status === "in_progress").length || 0
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
                  <CheckSquare className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">完了</p>
                  <p className="text-2xl font-semibold">
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin inline-block" />
                    ) : (
                      tasks?.filter(t => t.status === "completed").length || 0
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
                  <XCircle className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">延期</p>
                  <p className="text-2xl font-semibold">
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin inline-block" />
                    ) : (
                      tasks?.filter(t => t.status === "deferred").length || 0
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">タスク一覧</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="タスクを検索..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="ステータス" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべてのステータス</SelectItem>
                    <SelectItem value="pending">未着手</SelectItem>
                    <SelectItem value="in_progress">対応中</SelectItem>
                    <SelectItem value="completed">完了</SelectItem>
                    <SelectItem value="deferred">延期</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">タスク</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead>期限</TableHead>
                    <TableHead>作成日</TableHead>
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
                  ) : filteredTasks && filteredTasks.length > 0 ? (
                    filteredTasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <ListChecks className="mr-2 h-5 w-5 text-gray-500" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{task.title}</div>
                              <div className="text-xs text-gray-500 truncate max-w-[250px]">{task.description}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(task.status)}
                        </TableCell>
                        <TableCell>
                          {formatDate(task.dueDate)}
                        </TableCell>
                        <TableCell>
                          {formatDate(task.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/tasks/${task.id}`}>
                            <Button size="sm" variant="outline">
                              詳細
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <ListChecks className="h-10 w-10 mb-2 opacity-20" />
                          <p>検索条件に一致するタスクはありません</p>
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
