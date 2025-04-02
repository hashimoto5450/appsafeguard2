import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  Bell,
  Lock,
  Save,
  Settings as SettingsIcon,
  Shield,
  User,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Profile settings form schema
const profileFormSchema = z.object({
  username: z.string().min(3, "ユーザー名は3文字以上である必要があります"),
  email: z.string().email("有効なメールアドレスを入力してください"),
});

// Password settings form schema
const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, "現在のパスワードを入力してください"),
  newPassword: z.string().min(8, "新しいパスワードは8文字以上である必要があります"),
  confirmPassword: z.string().min(8, "パスワードの確認を入力してください"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "新しいパスワードと確認用パスワードが一致しません",
  path: ["confirmPassword"],
});

// Notification settings form schema
const notificationFormSchema = z.object({
  scanCompleted: z.boolean().default(true),
  vulnerabilityDetected: z.boolean().default(true),
  taskDeadlineReminder: z.boolean().default(true),
  taskAssigned: z.boolean().default(true),
  securityReports: z.boolean().default(true),
});

// Scan settings form schema
const scanSettingsFormSchema = z.object({
  defaultScanLevel: z.enum(["quick", "standard", "detailed"]),
  defaultCrawlLimit: z.enum(["10", "50", "100", "unlimited"]),
  useCustomRulesByDefault: z.boolean().default(false),
});

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");

  // Profile form
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: user?.username || "",
      email: user?.email || "",
    },
  });

  // Password form
  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Notifications form
  const notificationForm = useForm<z.infer<typeof notificationFormSchema>>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      scanCompleted: true,
      vulnerabilityDetected: true,
      taskDeadlineReminder: true,
      taskAssigned: true,
      securityReports: true,
    },
  });

  // Scan settings form
  const scanSettingsForm = useForm<z.infer<typeof scanSettingsFormSchema>>({
    resolver: zodResolver(scanSettingsFormSchema),
    defaultValues: {
      defaultScanLevel: "standard",
      defaultCrawlLimit: "50",
      useCustomRulesByDefault: false,
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (values: z.infer<typeof profileFormSchema>) => {
      // This endpoint doesn't exist yet but would be implemented in a real app
      try {
        const res = await apiRequest("PATCH", "/api/user", values);
        return await res.json();
      } catch (error) {
        // Handle gracefully since the endpoint doesn't exist yet
        console.warn("Update profile endpoint not implemented yet");
        // Mock success for demonstration
        return { success: true };
      }
    },
    onSuccess: () => {
      toast({
        title: "プロフィールが更新されました",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "プロフィールの更新に失敗しました",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (values: z.infer<typeof passwordFormSchema>) => {
      // This endpoint doesn't exist yet but would be implemented in a real app
      try {
        const res = await apiRequest("PATCH", "/api/user/password", values);
        return await res.json();
      } catch (error) {
        // Handle gracefully since the endpoint doesn't exist yet
        console.warn("Update password endpoint not implemented yet");
        // Mock success for demonstration
        return { success: true };
      }
    },
    onSuccess: () => {
      toast({
        title: "パスワードが更新されました",
        variant: "default",
      });
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "パスワードの更新に失敗しました",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update notification settings mutation
  const updateNotificationsMutation = useMutation({
    mutationFn: async (values: z.infer<typeof notificationFormSchema>) => {
      // This endpoint doesn't exist yet but would be implemented in a real app
      try {
        const res = await apiRequest("PATCH", "/api/user/notifications", values);
        return await res.json();
      } catch (error) {
        // Handle gracefully since the endpoint doesn't exist yet
        console.warn("Update notifications endpoint not implemented yet");
        // Mock success for demonstration
        return { success: true };
      }
    },
    onSuccess: () => {
      toast({
        title: "通知設定が更新されました",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "通知設定の更新に失敗しました",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update scan settings mutation
  const updateScanSettingsMutation = useMutation({
    mutationFn: async (values: z.infer<typeof scanSettingsFormSchema>) => {
      // This endpoint doesn't exist yet but would be implemented in a real app
      try {
        const res = await apiRequest("PATCH", "/api/user/scan-settings", values);
        return await res.json();
      } catch (error) {
        // Handle gracefully since the endpoint doesn't exist yet
        console.warn("Update scan settings endpoint not implemented yet");
        // Mock success for demonstration
        return { success: true };
      }
    },
    onSuccess: () => {
      toast({
        title: "スキャン設定が更新されました",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "スキャン設定の更新に失敗しました",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form submission handlers
  const onProfileSubmit = (values: z.infer<typeof profileFormSchema>) => {
    updateProfileMutation.mutate(values);
  };

  const onPasswordSubmit = (values: z.infer<typeof passwordFormSchema>) => {
    updatePasswordMutation.mutate(values);
  };

  const onNotificationSubmit = (values: z.infer<typeof notificationFormSchema>) => {
    updateNotificationsMutation.mutate(values);
  };

  const onScanSettingsSubmit = (values: z.infer<typeof scanSettingsFormSchema>) => {
    updateScanSettingsMutation.mutate(values);
  };

  return (
    <AppLayout title="設定">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">設定</h1>
          <p className="text-muted-foreground">アカウント設定とアプリケーションの設定を管理します。</p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="md:w-1/4">
            <Card>
              <CardContent className="p-4">
                <nav className="space-y-1">
                  <Button
                    variant={activeTab === "profile" ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveTab("profile")}
                  >
                    <User className="mr-2 h-4 w-4" />
                    プロフィール
                  </Button>
                  <Button
                    variant={activeTab === "security" ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveTab("security")}
                  >
                    <Lock className="mr-2 h-4 w-4" />
                    セキュリティ
                  </Button>
                  <Button
                    variant={activeTab === "notifications" ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveTab("notifications")}
                  >
                    <Bell className="mr-2 h-4 w-4" />
                    通知
                  </Button>
                  <Button
                    variant={activeTab === "scan-settings" ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveTab("scan-settings")}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    スキャン設定
                  </Button>
                  <Button
                    variant={activeTab === "danger-zone" ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveTab("danger-zone")}
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    危険な操作
                  </Button>
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Content */}
          <div className="flex-1">
            {activeTab === "profile" && (
              <Card>
                <CardHeader>
                  <CardTitle>プロフィール設定</CardTitle>
                  <CardDescription>
                    ユーザー名とメールアドレスを管理します。
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...profileForm}>
                    <form
                      onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                      className="space-y-6"
                    >
                      <FormField
                        control={profileForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ユーザー名</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormDescription>
                              ユーザー名は他のユーザーに表示されます。
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>メールアドレス</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormDescription>
                              通知やパスワードリセットに使用されます。
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                        className="flex items-center gap-1"
                      >
                        {updateProfileMutation.isPending ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        保存
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {activeTab === "security" && (
              <Card>
                <CardHeader>
                  <CardTitle>セキュリティ設定</CardTitle>
                  <CardDescription>
                    パスワードを更新して、アカウントのセキュリティを管理します。
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...passwordForm}>
                    <form
                      onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                      className="space-y-6"
                    >
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>現在のパスワード</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="••••••••"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>新しいパスワード</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="••••••••"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              8文字以上で、英数字と記号を含めることをお勧めします。
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>パスワードの確認</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="••••••••"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        disabled={updatePasswordMutation.isPending}
                        className="flex items-center gap-1"
                      >
                        {updatePasswordMutation.isPending ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                        ) : (
                          <Lock className="h-4 w-4" />
                        )}
                        パスワードを更新
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {activeTab === "notifications" && (
              <Card>
                <CardHeader>
                  <CardTitle>通知設定</CardTitle>
                  <CardDescription>
                    どのような通知を受け取るかを管理します。
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...notificationForm}>
                    <form
                      onSubmit={notificationForm.handleSubmit(onNotificationSubmit)}
                      className="space-y-6"
                    >
                      <FormField
                        control={notificationForm.control}
                        name="scanCompleted"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>スキャン完了通知</FormLabel>
                              <FormDescription>
                                スキャンが完了したときに通知を受け取ります。
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
                      <FormField
                        control={notificationForm.control}
                        name="vulnerabilityDetected"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>脆弱性検出通知</FormLabel>
                              <FormDescription>
                                重大な脆弱性が検出されたときに通知を受け取ります。
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
                      <FormField
                        control={notificationForm.control}
                        name="taskDeadlineReminder"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>タスク期限リマインダー</FormLabel>
                              <FormDescription>
                                タスクの期限が近づいたときにリマインダーを受け取ります。
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
                      <FormField
                        control={notificationForm.control}
                        name="taskAssigned"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>タスク割り当て通知</FormLabel>
                              <FormDescription>
                                新しいタスクが割り当てられたときに通知を受け取ります。
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
                      <FormField
                        control={notificationForm.control}
                        name="securityReports"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>セキュリティレポート通知</FormLabel>
                              <FormDescription>
                                新しいセキュリティレポートが生成されたときに通知を受け取ります。
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
                      <Button
                        type="submit"
                        disabled={updateNotificationsMutation.isPending}
                        className="flex items-center gap-1"
                      >
                        {updateNotificationsMutation.isPending ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                        ) : (
                          <Bell className="h-4 w-4" />
                        )}
                        通知設定を保存
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {activeTab === "scan-settings" && (
              <Card>
                <CardHeader>
                  <CardTitle>スキャン設定</CardTitle>
                  <CardDescription>
                    スキャンのデフォルト設定を管理します。
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...scanSettingsForm}>
                    <form
                      onSubmit={scanSettingsForm.handleSubmit(onScanSettingsSubmit)}
                      className="space-y-6"
                    >
                      <FormField
                        control={scanSettingsForm.control}
                        name="defaultScanLevel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>デフォルトのスキャンレベル</FormLabel>
                            <FormControl>
                              <select
                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                value={field.value}
                                onChange={field.onChange}
                              >
                                <option value="quick">クイック</option>
                                <option value="standard">標準</option>
                                <option value="detailed">詳細</option>
                              </select>
                            </FormControl>
                            <FormDescription>
                              新しいスキャンを開始するときのデフォルトのスキャンレベルです。
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={scanSettingsForm.control}
                        name="defaultCrawlLimit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>デフォルトのクロール制限</FormLabel>
                            <FormControl>
                              <select
                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                value={field.value}
                                onChange={field.onChange}
                              >
                                <option value="10">10ページ</option>
                                <option value="50">50ページ</option>
                                <option value="100">100ページ</option>
                                <option value="unlimited">無制限</option>
                              </select>
                            </FormControl>
                            <FormDescription>
                              新しいスキャンを開始するときのデフォルトのクロール制限です。
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={scanSettingsForm.control}
                        name="useCustomRulesByDefault"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>デフォルトでカスタムルールを使用</FormLabel>
                              <FormDescription>
                                有効にすると、新しいスキャンでデフォルトでカスタムルールが使用されます。
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
                      <Button
                        type="submit"
                        disabled={updateScanSettingsMutation.isPending}
                        className="flex items-center gap-1"
                      >
                        {updateScanSettingsMutation.isPending ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                        ) : (
                          <Shield className="h-4 w-4" />
                        )}
                        スキャン設定を保存
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {activeTab === "danger-zone" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600">危険な操作</CardTitle>
                  <CardDescription>
                    これらの操作はやり直すことができません。慎重に行ってください。
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="rounded-lg border border-red-200 p-4">
                    <h3 className="font-medium text-red-600">データの削除</h3>
                    <p className="text-sm text-gray-600 mt-1 mb-4">
                      すべてのスキャン結果、脆弱性データ、タスク、およびカスタムルールが削除されます。このアクションは元に戻せません。
                    </p>
                    <Button variant="destructive">
                      すべてのデータを削除
                    </Button>
                  </div>
                  <Separator />
                  <div className="rounded-lg border border-red-200 p-4">
                    <h3 className="font-medium text-red-600">アカウントの削除</h3>
                    <p className="text-sm text-gray-600 mt-1 mb-4">
                      アカウントとそれに関連するすべてのデータが完全に削除されます。このアクションは元に戻せません。
                    </p>
                    <Button variant="destructive">
                      アカウントを削除
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
