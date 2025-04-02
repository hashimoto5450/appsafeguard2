import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import ScansPage from "@/pages/scans-page";
import ScanDetailPage from "@/pages/scan-detail-page";
import VulnerabilitiesPage from "@/pages/vulnerabilities-page";
import VulnerabilityDetailPage from "@/pages/vulnerability-detail-page";
import TasksPage from "@/pages/tasks-page";
import RulesPage from "@/pages/rules-page";
import ReportsPage from "@/pages/reports-page";
import SettingsPage from "@/pages/settings-page";
import MetricsPage from "@/pages/metrics-page";
import { useAuth } from "./hooks/use-auth";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

// Protected route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    console.log("ProtectedRoute effect - user:", user, "isLoading:", isLoading);
    if (!isLoading && !user) {
      console.log("Redirecting to /auth from protected route");
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    console.log("ProtectedRoute - Loading state");
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!user) {
    console.log("ProtectedRoute - No user, returning null");
    return null;
  }

  console.log("ProtectedRoute - User authenticated, rendering children");
  return <>{children}</>;
}

// Auth route component
function AuthRouteWrapper() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    console.log("AuthRouteWrapper effect - user:", user, "isLoading:", isLoading);
    if (!isLoading && user) {
      console.log("Redirecting to / from auth route, user is authenticated");
      navigate("/");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    console.log("AuthRouteWrapper - Loading state");
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  console.log("AuthRouteWrapper - Rendering auth page");
  return <AuthPage />;
}

function App() {
  return (
    <>
      <Switch>
        <Route path="/auth">
          <AuthRouteWrapper />
        </Route>
        
        <Route path="/">
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        </Route>
        
        <Route path="/scans/:id">
          <ProtectedRoute>
            <ScanDetailPage />
          </ProtectedRoute>
        </Route>
        
        <Route path="/scans">
          <ProtectedRoute>
            <ScansPage />
          </ProtectedRoute>
        </Route>
        
        <Route path="/vulnerabilities/:id">
          <ProtectedRoute>
            <VulnerabilityDetailPage />
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
        
        <Route path="/metrics">
          <ProtectedRoute>
            <MetricsPage />
          </ProtectedRoute>
        </Route>
        
        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </>
  );
}

export default App;
