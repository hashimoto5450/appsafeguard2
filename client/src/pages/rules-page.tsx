import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { CustomRule } from "@/types";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PlusCircle, Search, Shield } from "lucide-react";
import { Link } from "wouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define form schema for creating a new rule
const newRuleSchema = z.object({
  name: z.string().min(3, "名前は3文字以上で入力してください").max(100, "名前は100文字以内で入力してください"),
  description: z.string().min(3, "説明は3文字以上で入力してください").max(1000, "説明は1000文字以内で入力してください"),
  category: z.string().min(1, "カテゴリを入力してください").max(100, "カテゴリは100文字以内で入力してください"),
  pattern: z.string().min(1, "パターンを入力してください").max(1000, "パターンは1000文字以内で入力してください"),
  severity: z.enum(["high", "medium", "low"]),
  enabled: z.boolean().default(true),
});

export default function RulesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewRuleOpen, setIsNewRuleOpen] = useState(false);
  const { toast } = useToast();
  
  // Fetch rules
  const { data: rules, isLoading } = useQuery<CustomRule[]>({
    queryKey: ["/api/rules"],
  });

  // Form for new rule
  const form = useForm<z.infer<typeof newRuleSchema>>({
    resolver: zodResolver(newRuleSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      pattern: "",
      severity: "medium",
      enabled: true,
    },
  });

  // Create rule mutation
  const createRuleMutation = useMutation({
    mutationFn: async (values: z.infer<typeof newRuleSchema>) => {
      const res = await apiRequest("POST", "/api/rules", values);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "ルールが作成されました",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/rules"] });
      form.reset();
      setIsNewRuleOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "ルールの作成に失敗しました",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: z.infer<typeof newRuleSchema>) => {
    try {
      // Test if pattern is valid regex
      new RegExp(values.pattern);
      createRuleMutation.mutate(values);
    } catch (error) {
      toast({
        title: "パターンが無効です",
        description: "有効な正規表現を入力してください",
        variant: "destructive",
      });
    }
  };

  // Get severity badge
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

  // Toggle rule enabled status
  const toggleRuleStatus = useMutation({
    mutationFn: async ({ id, enabled }: { id: number, enabled: boolean }) => {
      const res = await apiRequest("PATCH", `/api/rules/${id}`, { enabled });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rules"] });
    },
    onError: (error: Error) => {
      toast({
        title: "ルールの更新に失敗しました",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter rules based on search query
  const filteredRules = rules?.filter((rule) => {
    return searchQuery === "" || 
      rule.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      rule.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.category.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <AppLayout title="カスタムルール">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">カスタムルール管理</h1>
          <Dialog open={isNewRuleOpen} onOpenChange={setIsNewRuleOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                新規ルール
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>新規カスタムルール作成</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ルール名</FormLabel>
                        <FormControl>
                          <Input placeholder="ルール名を入力" {...field} />
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
                        <FormLabel>説明</FormLabel>
                        <FormControl>
                          <Textarea placeholder="ルールの説明を入力" rows={3} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>カテゴリ</FormLabel>
                          <FormControl>
                            <Input placeholder="カテゴリを入力" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="severity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>重大度</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="重大度を選択" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="high">高</SelectItem>
                              <SelectItem value="medium">中</SelectItem>
                              <SelectItem value="low">低</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="pattern"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>検出パターン (正規表現)</FormLabel>
                        <FormControl>
                          <Input placeholder="正規表現パターンを入力" {...field} />
                        </FormControl>
                        <FormDescription>
                          例: password\s*=\s*['"][^'"]+['"] (パスワードの直書き検出)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="enabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>有効化</FormLabel>
                          <FormDescription>
                            このルールをスキャンで使用するかどうか
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2 pt-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsNewRuleOpen(false)}
                    >
                      キャンセル
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createRuleMutation.isPending}
                    >
                      {createRuleMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          作成中...
                        </>
                      ) : (
                        "ルール作成"
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
            <CardTitle className="text-base">カスタムルール一覧</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ルールを検索..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">ルール名</TableHead>
                    <TableHead>カテゴリ</TableHead>
                    <TableHead>重大度</TableHead>
                    <TableHead>パターン</TableHead>
                    <TableHead>有効/無効</TableHead>
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
                  ) : filteredRules && filteredRules.length > 0 ? (
                    filteredRules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <Shield className="mr-2 h-5 w-5 text-primary" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{rule.name}</div>
                              <div className="text-xs text-gray-500 truncate max-w-[200px]">{rule.description}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{rule.category}</TableCell>
                        <TableCell>
                          {getSeverityBadge(rule.severity)}
                        </TableCell>
                        <TableCell>
                          <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">{rule.pattern}</code>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={rule.enabled}
                            onCheckedChange={(checked) => {
                              toggleRuleStatus.mutate({ id: rule.id, enabled: checked });
                            }}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/rules/${rule.id}`}>
                            <Button size="sm" variant="outline">
                              編集
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <Shield className="h-10 w-10 mb-2 opacity-20" />
                          <p>カスタムルールはまだありません</p>
                          <p className="text-sm">「新規ルール」ボタンでルールを作成してください</p>
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
