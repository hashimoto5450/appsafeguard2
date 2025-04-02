import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type LoginCredentials = {
  username: string;
  password: string;
};

type RegisterCredentials = InsertUser;

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginCredentials>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, RegisterCredentials>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  const {
    data: user,
    error,
    isLoading,
    refetch,
  } = useQuery<User | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      try {
        const res = await apiRequest("POST", "/api/login", credentials);
        const userData = await res.json();
        console.log("Login API response:", userData);
        return userData;
      } catch (error) {
        console.error("Login error:", error);
        if (error instanceof Error) {
          throw error;
        }
        throw new Error("ログインに失敗しました");
      }
    },
    onSuccess: async (user: User) => {
      console.log("Login mutation successful, setting user data and refetching");
      // 認証情報をキャッシュに保存
      queryClient.setQueryData(["/api/user"], user);
      
      // キャッシュ更新後に/api/userを再取得して最新の認証状態を確認
      await refetch();
      
      toast({
        title: "ログイン成功",
        description: `${user.username}さん、ようこそ！`,
        variant: "default",
      });
    },
    onError: (error: Error) => {
      console.error("Login mutation error:", error);
      toast({
        title: "ログイン失敗",
        description: error.message || "ユーザー名またはパスワードが正しくありません",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterCredentials) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "登録成功",
        description: "アカウントが作成されました！",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "登録失敗",
        description: error.message || "アカウントの作成に失敗しました",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "ログアウト成功",
        description: "またのご利用をお待ちしております",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "ログアウト失敗",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
