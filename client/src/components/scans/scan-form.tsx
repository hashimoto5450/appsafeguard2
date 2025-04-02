import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Define scan form schema
const scanFormSchema = z.object({
  url: z.string().url({ message: "有効なURLを入力してください" }),
  scanLevel: z.enum(["quick", "standard", "detailed"], {
    required_error: "スキャンレベルを選択してください",
  }),
  crawlLimit: z.enum(["10", "50", "100", "unlimited"], {
    required_error: "クロール制限を選択してください",
  }),
  useAuthentication: z.boolean().default(false),
  includeCustomRules: z.boolean().default(false),
});

type ScanFormValues = z.infer<typeof scanFormSchema>;

export function ScanForm() {
  const { toast } = useToast();
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);

  // Define form
  const form = useForm<ScanFormValues>({
    resolver: zodResolver(scanFormSchema),
    defaultValues: {
      url: "",
      scanLevel: "quick",
      crawlLimit: "10",
      useAuthentication: false,
      includeCustomRules: false,
    },
  });

  // Define scan mutation
  const scanMutation = useMutation({
    mutationFn: async (values: ScanFormValues) => {
      const parsedValues = {
        ...values,
        crawlLimit: values.crawlLimit === "unlimited" ? 9999 : parseInt(values.crawlLimit),
      };
      const res = await apiRequest("POST", "/api/scans", parsedValues);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "スキャンが開始されました",
        description: "スキャン結果はスキャン管理ページで確認できます",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/scans"] });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "スキャンの開始に失敗しました",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form submit handler
  const onSubmit = (values: ScanFormValues) => {
    scanMutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Webアプリケーション URL</FormLabel>
              <FormControl>
                <Input 
                  placeholder="https://example.com" 
                  {...field}
                  disabled={scanMutation.isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="scanLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>スキャンレベル</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  disabled={scanMutation.isPending}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="スキャンレベルを選択" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="quick">クイック</SelectItem>
                    <SelectItem value="standard">標準</SelectItem>
                    <SelectItem value="detailed">詳細</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  詳細レベルほど時間がかかりますが、より多くの脆弱性を検出します。
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="crawlLimit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>クロール制限</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  disabled={scanMutation.isPending}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="クロール制限を選択" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="10">10ページ</SelectItem>
                    <SelectItem value="50">50ページ</SelectItem>
                    <SelectItem value="100">100ページ</SelectItem>
                    <SelectItem value="unlimited">無制限</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  スキャンするページ数の上限を設定します。
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="useAuthentication"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={scanMutation.isPending}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>認証が必要</FormLabel>
                  <FormDescription>
                    ログインが必要なサイトをスキャンする場合に選択してください。
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="includeCustomRules"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={scanMutation.isPending}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>カスタムルールを含める</FormLabel>
                  <FormDescription>
                    作成したカスタムルールでもスキャンします。
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end pt-4">
          <Dialog open={advancedSettingsOpen} onOpenChange={setAdvancedSettingsOpen}>
            <DialogTrigger asChild>
              <Button 
                type="button" 
                variant="outline" 
                className="mr-3"
                disabled={scanMutation.isPending}
              >
                詳細設定
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>詳細設定</DialogTitle>
                <DialogDescription>
                  スキャンの詳細設定を行います。
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <p className="text-sm text-muted-foreground">
                  詳細設定は現在準備中です。将来のバージョンでご利用いただけます。
                </p>
              </div>
              <Button 
                type="button" 
                onClick={() => setAdvancedSettingsOpen(false)}
              >
                閉じる
              </Button>
            </DialogContent>
          </Dialog>
          
          <Button 
            type="submit" 
            disabled={scanMutation.isPending}
          >
            {scanMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                スキャン中...
              </>
            ) : (
              "スキャン開始"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
