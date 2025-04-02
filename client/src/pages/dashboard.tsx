import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { SecurityScoreCard } from "@/components/dashboard/security-score-card";
import { VulnerabilitiesCard } from "@/components/dashboard/vulnerabilities-card";
import { RemediationTasksCard } from "@/components/dashboard/remediation-tasks-card";
import { VulnerabilityTrendChart } from "@/components/dashboard/vulnerability-trend-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { VulnerabilitiesTable } from "@/components/dashboard/vulnerabilities-table";
import { ScansCard } from "@/components/dashboard/scans-card";
import { ScanForm } from "@/components/scans/scan-form";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { VulnerabilitySummary, TaskSummary, Scan } from "@/types";

export default function Dashboard() {
  // Fetch scans data
  const { data: scans, isLoading: isLoadingScans } = useQuery<Scan[]>({
    queryKey: ["/api/scans"],
  });

  // Fetch vulnerability summary data
  const { data: vulnerabilitySummary, isLoading: isLoadingVulnerabilities } = useQuery<VulnerabilitySummary>({
    queryKey: ["/api/vulnerabilities/summary"],
  });

  // Fetch task summary data
  const { data: taskSummary, isLoading: isLoadingTasks } = useQuery<TaskSummary>({
    queryKey: ["/api/tasks/summary"],
  });

  return (
    <AppLayout title="ダッシュボード">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Security Score Section */}
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SecurityScoreCard 
              score={vulnerabilitySummary?.securityScore || 0} 
              isLoading={isLoadingVulnerabilities}
            />
            
            <VulnerabilitiesCard 
              total={vulnerabilitySummary?.total || 0}
              high={vulnerabilitySummary?.bySeverity.high || 0}
              medium={vulnerabilitySummary?.bySeverity.medium || 0}
              low={vulnerabilitySummary?.bySeverity.low || 0}
              isLoading={isLoadingVulnerabilities}
            />
            
            <RemediationTasksCard 
              completed={taskSummary?.byStatus.completed || 0}
              total={taskSummary?.total || 0}
              isLoading={isLoadingTasks}
            />
          </div>
        </div>
        
        {/* Statistics & Chart Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <VulnerabilityTrendChart />
          </div>
          
          <div>
            <ScansCard 
              latestScans={scans} 
              isLoading={isLoadingScans}
            />
          </div>
        </div>
        
        {/* Recent Activity Section */}
        <div className="mb-6">
          <RecentActivity />
        </div>
        
        {/* Vulnerabilities Summary Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-800">最近の脆弱性</h3>
            <Link href="/vulnerabilities">
              <Button variant="link" className="text-primary-600 hover:text-primary-700 p-0">
                すべて表示 →
              </Button>
            </Link>
          </div>
          
          <VulnerabilitiesTable />
        </div>
        
        {/* Quick Scan Section */}
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-800">クイックスキャン</h3>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <ScanForm />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
