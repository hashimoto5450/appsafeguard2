import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import ScansPage from "@/pages/scans-page";
import VulnerabilitiesPage from "@/pages/vulnerabilities-page";
import TasksPage from "@/pages/tasks-page";
import RulesPage from "@/pages/rules-page";
import ReportsPage from "@/pages/reports-page";
import SettingsPage from "@/pages/settings-page";
import { useAuth, ProtectedRoute } from "@/components/auth-provider";
import { Loader2 } from "lucide-react";

// Auth page has its own route and redirects to dashboard if already logged in
function AuthRoute() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && user) {
      navigate("/");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return <AuthPage />;
}

function AppWithAuth() {
  return (
    <>
      <Switch>
        <Route path="/auth">
          <AuthRoute />
        </Route>
        <Route path="/">
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        </Route>
        <Route path="/scans">
          <ProtectedRoute>
            <ScansPage />
          </ProtectedRoute>
        </Route>
        <Route path="/vulnerabilities">
          <ProtectedRoute>
            <VulnerabilitiesPage />
          </ProtectedRoute>
        </Route>
        <Route path="/tasks">
          <ProtectedRoute>
            <TasksPage />
          </ProtectedRoute>
        </Route>
        <Route path="/rules">
          <ProtectedRoute>
            <RulesPage />
          </ProtectedRoute>
        </Route>
        <Route path="/reports">
          <ProtectedRoute>
            <ReportsPage />
          </ProtectedRoute>
        </Route>
        <Route path="/settings">
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        </Route>
        <Route>
          <NotFound />
        </Route>
      </Switch>
      <Toaster />
    </>
  );
}

export default AppWithAuth;