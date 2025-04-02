export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface Scan {
  id: number;
  userId: number;
  url: string;
  scanLevel: string;
  crawlLimit: number;
  useAuthentication: boolean;
  includeCustomRules: boolean;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt: string | null;
  result: ScanResult | null;
}

export interface ScanResult {
  totalVulnerabilities: number;
  highSeverity: number;
  mediumSeverity: number;
  lowSeverity: number;
  securityScore: number;
  error?: string;
}

export interface Vulnerability {
  id: number;
  scanId: number;
  name: string;
  description: string;
  url: string;
  severity: 'high' | 'medium' | 'low' | 'safe';
  category: string;
  details: any;
  status: 'pending' | 'in_progress' | 'fixed' | 'false_positive' | 'open' | 'safe';
  createdAt: string;
  updatedAt: string | null;
}

export interface Task {
  id: number;
  vulnerabilityId: number | null;
  userId: number;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'deferred';
  assignedTo: number | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CustomRule {
  id: number;
  userId: number;
  name: string;
  description: string;
  category: string;
  pattern: string;
  severity: 'high' | 'medium' | 'low' | 'safe';
  enabled: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface Report {
  id: number;
  userId: number;
  title: string;
  type: 'vulnerability' | 'task' | 'security';
  format: 'pdf' | 'json' | 'csv';
  data: any;
  createdAt: string;
}

export interface SecurityEvent {
  id: number;
  userId: number | null;
  type: string;
  description: string;
  metadata: any;
  createdAt: string;
}

export interface VulnerabilitySummary {
  total: number;
  bySeverity: {
    high: number;
    medium: number;
    low: number;
    safe: number;
  };
  byStatus: {
    pending: number;
    in_progress: number;
    fixed: number;
    false_positive: number;
    open: number;
    safe: number;
  };
  securityScore: number;
}

export interface TaskSummary {
  total: number;
  byStatus: {
    pending: number;
    in_progress: number;
    completed: number;
    deferred: number;
  };
}

export interface Activity {
  id: string;
  type: 'scan_completed' | 'vulnerability_detected' | 'task_completed' | 'custom';
  icon: React.ReactNode;
  text: string;
  time: string;
  color: string;
}

export interface SecurityMetrics {
  securityScore: number;
  securityScoreTrend?: number;
  riskScore: number;
  riskScoreTrend?: number;
  mttr: number; // Mean Time to Remediate (days)
  mttrTrend?: number;
  remediationRate: number; // Percentage
  remediationRateTrend?: number;
  securityDebt: number;
  securityDebtTrend?: number;
  vulnerabilityDensity: number;
  vulnerabilityDensityTrend?: number;
  totalVulnerabilities: number;
  highSeverityCount: number;
  mediumSeverityCount: number;
  lowSeverityCount: number;
  fixedVulnerabilityCount: number;
  vulnerabilitiesInProgress: number;
  vulnerabilitiesPending: number;
  topVulnerableUrls: {url: string, count: number}[];
  vulnerabilityCategories: Record<string, number>;
}

export interface TrendDataPoint {
  period: string;
  securityScore: number;
  vulnerabilityCount: number;
  scanCount: number;
  highSeverity: number;
  mediumSeverity: number;
  lowSeverity: number;
  fixedVulnerabilityCount: number;
  taskCount: number;
  completedTaskCount: number;
}
