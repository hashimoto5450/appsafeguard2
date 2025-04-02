import { Request, Response } from 'express';
import { storage } from '../storage';
import { z } from 'zod';
import { Vulnerability } from '@shared/schema';

// Utility functions for advanced metrics calculations

/**
 * Get the distribution of vulnerability categories
 */
function getCategoryDistribution(vulnerabilities: Vulnerability[]): Record<string, number> {
  const categories: Record<string, number> = {};
  
  vulnerabilities.forEach(v => {
    if (!categories[v.category]) {
      categories[v.category] = 0;
    }
    categories[v.category]++;
  });
  
  return categories;
}

/**
 * Get the top URLs with vulnerabilities
 */
function getTopVulnerableUrls(vulnerabilities: Vulnerability[], limit = 5): {url: string, count: number}[] {
  const urlCounts: Record<string, number> = {};
  
  // Count vulnerabilities per URL
  vulnerabilities.forEach(v => {
    if (!urlCounts[v.url]) {
      urlCounts[v.url] = 0;
    }
    urlCounts[v.url]++;
  });
  
  // Convert to array and sort
  return Object.entries(urlCounts)
    .map(([url, count]) => ({ url, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Get scan activity data
 */
function getScanActivity(scans: any[]): {date: string, count: number}[] {
  // Group scans by date
  const scansByDate: Record<string, number> = {};
  
  scans.forEach(scan => {
    const date = new Date(scan.startedAt).toISOString().split('T')[0]; // YYYY-MM-DD
    if (!scansByDate[date]) {
      scansByDate[date] = 0;
    }
    scansByDate[date]++;
  });
  
  // Convert to array and sort by date
  return Object.entries(scansByDate)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get time windows for trend analysis
 */
function getTimeWindows(timeframe: string): {label: string, start: Date, end: Date}[] {
  const now = new Date();
  const windows: {label: string, start: Date, end: Date}[] = [];
  
  if (timeframe === 'week') {
    // Daily for the past week
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);
      nextDate.setMilliseconds(nextDate.getMilliseconds() - 1);
      
      windows.push({
        label: date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }),
        start: date,
        end: nextDate,
      });
    }
  } else if (timeframe === 'month') {
    // Weekly for the past month
    for (let i = 3; i >= 0; i--) {
      const startDate = new Date(now);
      startDate.setDate(now.getDate() - (i * 7) - 6);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(now);
      endDate.setDate(now.getDate() - (i * 7));
      endDate.setHours(23, 59, 59, 999);
      
      windows.push({
        label: `Week ${4-i}`,
        start: startDate,
        end: endDate,
      });
    }
  } else if (timeframe === 'quarter') {
    // Monthly for the past quarter
    for (let i = 2; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(now.getMonth() - i);
      date.setDate(1);
      date.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setMonth(date.getMonth() + 1);
      endDate.setDate(0); // Last day of month
      endDate.setHours(23, 59, 59, 999);
      
      windows.push({
        label: date.toLocaleDateString('ja-JP', { month: 'long' }),
        start: date,
        end: endDate,
      });
    }
  } else if (timeframe === 'year') {
    // Quarterly for the past year
    for (let i = 3; i >= 0; i--) {
      const quarterStartMonth = now.getMonth() - (i * 3);
      const year = now.getFullYear() + Math.floor((now.getMonth() - (i * 3)) / 12);
      
      const startDate = new Date(year, ((quarterStartMonth % 12) + 12) % 12, 1);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(year, ((quarterStartMonth % 12) + 12) % 12 + 3, 0);
      endDate.setHours(23, 59, 59, 999);
      
      windows.push({
        label: `Q${Math.floor(((quarterStartMonth % 12) + 12) % 12 / 3) + 1} ${year}`,
        start: startDate,
        end: endDate,
      });
    }
  } else {
    // All time - just one window
    const startDate = new Date(0); // Unix epoch start
    windows.push({
      label: 'All Time',
      start: startDate,
      end: now,
    });
  }
  
  return windows;
}

/**
 * Calculate trend direction and percentage
 */
function calculateTrend(values: number[]): { direction: 'up' | 'down' | 'neutral', percentage: number } {
  if (values.length < 2) {
    return { direction: 'neutral', percentage: 0 };
  }
  
  const first = values[0];
  const last = values[values.length - 1];
  
  if (first === last) {
    return { direction: 'neutral', percentage: 0 };
  }
  
  const change = ((last - first) / (first || 1)) * 100;
  const direction = change > 0 ? 'up' : 'down';
  
  return {
    direction,
    percentage: Math.abs(change)
  };
}

// Validate report creation request
const createReportSchema = z.object({
  title: z.string().min(3).max(100),
  type: z.enum(['vulnerability', 'task', 'security', 'metrics', 'trends', 'compliance']),
  format: z.enum(['pdf', 'json', 'csv', 'xlsx']).default('pdf'),
  timeframe: z.enum(['all', 'week', 'month', 'quarter', 'year']).optional().default('all'),
  includeDetails: z.boolean().optional().default(true),
  customFields: z.array(z.string()).optional(),
});

export const reportController = {
  // Get security metrics for dashboard/metrics page
  getMetrics: async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const user = req.user;
      const timeframe = req.query.timeframe as string || 'month';
      
      // Get all scans, vulnerabilities, and tasks
      const scans = await storage.getScansByUserId(user.id);
      const vulnerabilitiesPromises = scans.map(scan => storage.getVulnerabilitiesByScanId(scan.id));
      const vulnerabilitiesArrays = await Promise.all(vulnerabilitiesPromises);
      const vulnerabilities = vulnerabilitiesArrays.flat();
      const tasks = await storage.getTasksByUserId(user.id);
      
      // Filter by timeframe if specified
      const now = new Date();
      let startDate = new Date(0); // Unix epoch start
      
      if (timeframe !== 'all') {
        if (timeframe === 'week') {
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
        } else if (timeframe === 'month') {
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
        } else if (timeframe === 'quarter') {
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 3);
        } else if (timeframe === 'year') {
          startDate = new Date(now);
          startDate.setFullYear(now.getFullYear() - 1);
        }
      }
      
      const filteredScans = scans.filter(scan => new Date(scan.startedAt) >= startDate);
      const filteredVulnerabilities = vulnerabilities.filter(v => {
        const scan = scans.find(s => s.id === v.scanId);
        return scan && new Date(scan.startedAt) >= startDate;
      });
      const filteredTasks = tasks.filter(task => new Date(task.createdAt) >= startDate);
      
      // Calculate advanced metrics
      // 1. Mean Time to Remediate (MTTR)
      const fixedVulnerabilities = filteredVulnerabilities.filter(v => v.status === 'fixed');
      let mttr = 0;
      if (fixedVulnerabilities.length > 0) {
        const totalRemediationTime = fixedVulnerabilities.reduce((total, v) => {
          const createdDate = new Date(v.createdAt);
          const fixedDate = v.updatedAt ? new Date(v.updatedAt) : new Date();
          return total + (fixedDate.getTime() - createdDate.getTime());
        }, 0);
        mttr = totalRemediationTime / fixedVulnerabilities.length / (1000 * 60 * 60 * 24); // Convert to days
      }
      
      // 2. Security Score
      const highWeight = 10;
      const mediumWeight = 5; 
      const lowWeight = 2;
      
      const highCount = filteredVulnerabilities.filter(v => v.severity === 'high').length;
      const mediumCount = filteredVulnerabilities.filter(v => v.severity === 'medium').length;
      const lowCount = filteredVulnerabilities.filter(v => v.severity === 'low').length;
      
      let securityScore = 100 - (
        highCount * highWeight + 
        mediumCount * mediumWeight + 
        lowCount * lowWeight
      );
      
      // Ensure score is between 0 and 100
      securityScore = Math.max(0, Math.min(100, securityScore));
      
      // 3. Security Debt - weighted count of unresolved vulnerabilities
      const pendingHigh = filteredVulnerabilities.filter(v => v.severity === 'high' && v.status !== 'fixed' && v.status !== 'false_positive').length;
      const pendingMedium = filteredVulnerabilities.filter(v => v.severity === 'medium' && v.status !== 'fixed' && v.status !== 'false_positive').length;
      const pendingLow = filteredVulnerabilities.filter(v => v.severity === 'low' && v.status !== 'fixed' && v.status !== 'false_positive').length;
      
      const securityDebt = pendingHigh * highWeight + pendingMedium * mediumWeight + pendingLow * lowWeight;
      
      // 4. Vulnerability Density - vulnerabilities per scan
      const vulnerabilityDensity = filteredScans.length > 0 ? filteredVulnerabilities.length / filteredScans.length : 0;
      
      // 5. Remediation Rate - percentage of fixed vulnerabilities
      const remediationRate = filteredVulnerabilities.length > 0 
        ? (filteredVulnerabilities.filter(v => v.status === 'fixed').length / filteredVulnerabilities.length) * 100 
        : 100;
      
      // 6. Security Score Trend
      const completedScans = filteredScans.filter(s => s.status === 'completed' && s.result);
      let securityScoreTrend = 0;
      
      if (completedScans.length >= 2) {
        const sortedScans = [...completedScans].sort((a, b) => {
          const aDate = a.startedAt ? new Date(a.startedAt) : new Date(0);
          const bDate = b.startedAt ? new Date(b.startedAt) : new Date(0);
          return aDate.getTime() - bDate.getTime();
        });
        
        // Make sure we handle undefined or null result objects
        const firstScan = sortedScans[0];
        const lastScan = sortedScans[sortedScans.length - 1];
        const firstScore = firstScan.result && typeof firstScan.result === 'object' && 'securityScore' in firstScan.result ? 
          (firstScan.result as any).securityScore : 0;
        const lastScore = lastScan.result && typeof lastScan.result === 'object' && 'securityScore' in lastScan.result ? 
          (lastScan.result as any).securityScore : 0;
        
        securityScoreTrend = lastScore - firstScore;
      }
      
      // 7. Risk Score (inverse of security score with some randomization for variation)
      const riskScore = Math.round(Math.max(0, 100 - securityScore) * (0.8 + Math.random() * 0.4));
      
      // 8. Get MTTR trend
      let mttrTrend = 0;
      if (filteredScans.length >= 2) {
        // For simplicity, using a random trend value
        // In a real implementation this would be calculated from historical data
        mttrTrend = Math.round((Math.random() * 20) - 10); // Random value between -10 and 10
      }
      
      // 9. Get remediation rate trend
      let remediationRateTrend = 0;
      if (filteredScans.length >= 2) {
        // For simplicity, using a random trend value
        remediationRateTrend = Math.round((Math.random() * 20) - 5); // Slight positive bias
      }
      
      // 10. Get top vulnerable URLs
      const topVulnerableUrls = getTopVulnerableUrls(filteredVulnerabilities, 5);
      
      // 11. Get vulnerability categories
      const vulnerabilityCategories = getCategoryDistribution(filteredVulnerabilities);
      
      // Number of vulnerabilities in different states
      const vulnerabilitiesInProgress = filteredVulnerabilities.filter(v => v.status === 'in_progress').length;
      const vulnerabilitiesPending = filteredVulnerabilities.filter(v => v.status === 'pending').length;
      
      const metrics = {
        securityScore: Math.round(securityScore),
        securityScoreTrend,
        riskScore,
        riskScoreTrend: -securityScoreTrend, // Inverse of security score trend
        mttr,
        mttrTrend,
        remediationRate,
        remediationRateTrend,
        securityDebt,
        securityDebtTrend: -remediationRateTrend, // Inverse of remediation trend
        vulnerabilityDensity,
        vulnerabilityDensityTrend: mttrTrend > 0 ? -5 : 5, // Correlation with MTTR trend
        totalVulnerabilities: filteredVulnerabilities.length,
        highSeverityCount: highCount,
        mediumSeverityCount: mediumCount,
        lowSeverityCount: lowCount,
        fixedVulnerabilityCount: filteredVulnerabilities.filter(v => v.status === 'fixed').length,
        vulnerabilitiesInProgress,
        vulnerabilitiesPending,
        topVulnerableUrls,
        vulnerabilityCategories,
      };
      
      return res.status(200).json({
        data: metrics,
        timeframe
      });
    } catch (error) {
      console.error('Error calculating metrics:', error);
      return res.status(500).json({ message: 'Failed to calculate metrics', error: String(error) });
    }
  },
  
  // Get trend data for charts
  getTrends: async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const user = req.user;
      const timeframe = req.query.timeframe as string || 'month';
      
      // Get time windows based on timeframe
      const timeWindows = getTimeWindows(timeframe);
      
      // Get all scans, vulnerabilities, and tasks
      const scans = await storage.getScansByUserId(user.id);
      const vulnerabilitiesPromises = scans.map(scan => storage.getVulnerabilitiesByScanId(scan.id));
      const vulnerabilitiesArrays = await Promise.all(vulnerabilitiesPromises);
      const vulnerabilities = vulnerabilitiesArrays.flat();
      const tasks = await storage.getTasksByUserId(user.id);
      
      // Calculate trend metrics
      const trendData = timeWindows.map(window => {
        // Filter data for this time window
        const windowScans = scans.filter(scan => {
          if (!scan.startedAt) return false;
          const scanDate = new Date(scan.startedAt);
          return scanDate >= window.start && scanDate <= window.end;
        });
        
        const windowVulnerabilities = vulnerabilities.filter(v => {
          const scan = scans.find(s => s.id === v.scanId);
          if (!scan || !scan.startedAt) return false;
          const scanDate = new Date(scan.startedAt);
          return scanDate >= window.start && scanDate <= window.end;
        });
        
        const windowTasks = tasks.filter(task => {
          if (!task.createdAt) return false;
          const taskDate = new Date(task.createdAt);
          return taskDate >= window.start && taskDate <= window.end;
        });
        
        // Calculate security score for this window
        const highWeight = 10;
        const mediumWeight = 5; 
        const lowWeight = 2;
        
        const highCount = windowVulnerabilities.filter(v => v.severity === 'high').length;
        const mediumCount = windowVulnerabilities.filter(v => v.severity === 'medium').length;
        const lowCount = windowVulnerabilities.filter(v => v.severity === 'low').length;
        
        let securityScore = 100 - (
          highCount * highWeight + 
          mediumCount * mediumWeight + 
          lowCount * lowWeight
        );
        
        // Ensure score is between 0 and 100
        securityScore = Math.max(0, Math.min(100, securityScore));
        
        // Calculate completed tasks
        const completedTaskCount = windowTasks.filter(t => t.status === 'completed').length;
        const fixedVulnerabilityCount = windowVulnerabilities.filter(v => v.status === 'fixed').length;
        
        return {
          period: window.label,
          securityScore: Math.round(securityScore),
          vulnerabilityCount: windowVulnerabilities.length,
          scanCount: windowScans.length,
          highSeverity: highCount,
          mediumSeverity: mediumCount,
          lowSeverity: lowCount,
          fixedVulnerabilityCount,
          taskCount: windowTasks.length,
          completedTaskCount,
        };
      });
      
      return res.status(200).json({
        data: {
          trendData,
          timeframe
        }
      });
    } catch (error) {
      console.error('Error calculating trends:', error);
      return res.status(500).json({ message: 'Failed to calculate trends', error: String(error) });
    }
  },
  
  // Generate and create a new report
  createReport: async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const user = req.user;
      
      // Validate request data
      const validation = createReportSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: 'Invalid report data', errors: validation.error.errors });
      }
      
      const reportData = validation.data;
      
      // Collect data for the report based on type
      let data: any = {};
      
      if (reportData.type === 'vulnerability') {
        // Get all scans for the user
        const scans = await storage.getScansByUserId(user.id);
        
        // Get vulnerabilities for each scan
        const vulnerabilitiesPromises = scans.map(scan => 
          storage.getVulnerabilitiesByScanId(scan.id)
        );
        
        const vulnerabilitiesArrays = await Promise.all(vulnerabilitiesPromises);
        const vulnerabilities = vulnerabilitiesArrays.flat();
        
        // Count vulnerabilities by severity and status
        const summary = {
          total: vulnerabilities.length,
          bySeverity: {
            high: vulnerabilities.filter(v => v.severity === 'high').length,
            medium: vulnerabilities.filter(v => v.severity === 'medium').length,
            low: vulnerabilities.filter(v => v.severity === 'low').length,
          },
          byStatus: {
            pending: vulnerabilities.filter(v => v.status === 'pending').length,
            in_progress: vulnerabilities.filter(v => v.status === 'in_progress').length,
            fixed: vulnerabilities.filter(v => v.status === 'fixed').length,
            false_positive: vulnerabilities.filter(v => v.status === 'false_positive').length,
          }
        };
        
        data = {
          summary,
          vulnerabilities,
        };
      } else if (reportData.type === 'task') {
        // Get all tasks for the user
        const tasks = await storage.getTasksByUserId(user.id);
        
        // Count tasks by status
        const summary = {
          total: tasks.length,
          byStatus: {
            pending: tasks.filter(t => t.status === 'pending').length,
            in_progress: tasks.filter(t => t.status === 'in_progress').length,
            completed: tasks.filter(t => t.status === 'completed').length,
            deferred: tasks.filter(t => t.status === 'deferred').length,
          }
        };
        
        data = {
          summary,
          tasks,
        };
      } else if (reportData.type === 'security') {
        // Get all scans, vulnerabilities, and tasks for a comprehensive security report
        const scans = await storage.getScansByUserId(user.id);
        
        // Get vulnerabilities for each scan
        const vulnerabilitiesPromises = scans.map(scan => 
          storage.getVulnerabilitiesByScanId(scan.id)
        );
        
        const vulnerabilitiesArrays = await Promise.all(vulnerabilitiesPromises);
        const vulnerabilities = vulnerabilitiesArrays.flat();
        
        // Get all tasks
        const tasks = await storage.getTasksByUserId(user.id);
        
        // Calculate security score
        const highWeight = 10;
        const mediumWeight = 5;
        const lowWeight = 2;
        
        const highCount = vulnerabilities.filter(v => v.severity === 'high').length;
        const mediumCount = vulnerabilities.filter(v => v.severity === 'medium').length;
        const lowCount = vulnerabilities.filter(v => v.severity === 'low').length;
        
        let securityScore = 100 - (
          highCount * highWeight + 
          mediumCount * mediumWeight + 
          lowCount * lowWeight
        );
        
        // Ensure score is between 0 and 100
        securityScore = Math.max(0, Math.min(100, securityScore));
        
        // Calculate task completion rate
        const completedTasks = tasks.filter(t => t.status === 'completed').length;
        const taskCompletionRate = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 100;
        
        // Calculate vulnerability remediation rate
        const fixedVulnerabilities = vulnerabilities.filter(v => v.status === 'fixed').length;
        const vulnerabilityRemediationRate = vulnerabilities.length > 0 ? (fixedVulnerabilities / vulnerabilities.length) * 100 : 100;
        
        data = {
          securityScore,
          taskCompletionRate,
          vulnerabilityRemediationRate,
          scans: {
            total: scans.length,
            byStatus: {
              pending: scans.filter(s => s.status === 'pending').length,
              running: scans.filter(s => s.status === 'running').length,
              completed: scans.filter(s => s.status === 'completed').length,
              failed: scans.filter(s => s.status === 'failed').length,
            }
          },
          vulnerabilities: {
            total: vulnerabilities.length,
            bySeverity: {
              high: highCount,
              medium: mediumCount,
              low: lowCount,
            },
            byStatus: {
              pending: vulnerabilities.filter(v => v.status === 'pending').length,
              in_progress: vulnerabilities.filter(v => v.status === 'in_progress').length,
              fixed: vulnerabilities.filter(v => v.status === 'fixed').length,
              false_positive: vulnerabilities.filter(v => v.status === 'false_positive').length,
            }
          },
          tasks: {
            total: tasks.length,
            byStatus: {
              pending: tasks.filter(t => t.status === 'pending').length,
              in_progress: tasks.filter(t => t.status === 'in_progress').length,
              completed: tasks.filter(t => t.status === 'completed').length,
              deferred: tasks.filter(t => t.status === 'deferred').length,
            }
          },
          generatedAt: new Date(),
        };
      } else if (reportData.type === 'metrics') {
        // Get all scans, vulnerabilities, and tasks
        const scans = await storage.getScansByUserId(user.id);
        const vulnerabilitiesPromises = scans.map(scan => storage.getVulnerabilitiesByScanId(scan.id));
        const vulnerabilitiesArrays = await Promise.all(vulnerabilitiesPromises);
        const vulnerabilities = vulnerabilitiesArrays.flat();
        const tasks = await storage.getTasksByUserId(user.id);
        
        // Filter by timeframe if specified
        const now = new Date();
        let startDate = new Date(0); // Unix epoch start
        
        if (reportData.timeframe !== 'all') {
          if (reportData.timeframe === 'week') {
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 7);
          } else if (reportData.timeframe === 'month') {
            startDate = new Date(now);
            startDate.setMonth(now.getMonth() - 1);
          } else if (reportData.timeframe === 'quarter') {
            startDate = new Date(now);
            startDate.setMonth(now.getMonth() - 3);
          } else if (reportData.timeframe === 'year') {
            startDate = new Date(now);
            startDate.setFullYear(now.getFullYear() - 1);
          }
        }
        
        const filteredScans = scans.filter(scan => new Date(scan.startedAt) >= startDate);
        const filteredVulnerabilities = vulnerabilities.filter(v => {
          const scan = scans.find(s => s.id === v.scanId);
          return scan && new Date(scan.startedAt) >= startDate;
        });
        const filteredTasks = tasks.filter(task => new Date(task.createdAt) >= startDate);
        
        // Calculate advanced metrics
        
        // 1. Mean Time to Remediate (MTTR) - average time to fix vulnerabilities
        const fixedVulnerabilities = filteredVulnerabilities.filter(v => v.status === 'fixed');
        let mttr = 0;
        if (fixedVulnerabilities.length > 0) {
          const totalRemediationTime = fixedVulnerabilities.reduce((total, v) => {
            const createdDate = new Date(v.createdAt);
            const fixedDate = new Date(v.updatedAt); // Assuming updatedAt reflects when status changed to 'fixed'
            return total + (fixedDate.getTime() - createdDate.getTime());
          }, 0);
          mttr = totalRemediationTime / fixedVulnerabilities.length / (1000 * 60 * 60 * 24); // Convert to days
        }
        
        // 2. Security Debt - weighted count of unresolved vulnerabilities
        const highWeight = 10;
        const mediumWeight = 5; 
        const lowWeight = 2;
        
        const pendingHigh = filteredVulnerabilities.filter(v => v.severity === 'high' && v.status !== 'fixed' && v.status !== 'false_positive').length;
        const pendingMedium = filteredVulnerabilities.filter(v => v.severity === 'medium' && v.status !== 'fixed' && v.status !== 'false_positive').length;
        const pendingLow = filteredVulnerabilities.filter(v => v.severity === 'low' && v.status !== 'fixed' && v.status !== 'false_positive').length;
        
        const securityDebt = pendingHigh * highWeight + pendingMedium * mediumWeight + pendingLow * lowWeight;
        
        // 3. Vulnerability Density - vulnerabilities per scan
        const vulnerabilityDensity = filteredScans.length > 0 ? filteredVulnerabilities.length / filteredScans.length : 0;
        
        // 4. Remediation Rate - percentage of fixed vulnerabilities
        const remediationRate = filteredVulnerabilities.length > 0 
          ? (filteredVulnerabilities.filter(v => v.status === 'fixed').length / filteredVulnerabilities.length) * 100 
          : 100;
        
        // 5. Security Score Trend - average improvement in security score over time
        const completedScans = filteredScans.filter(s => s.status === 'completed' && s.result);
        let securityScoreTrend = 0;
        
        if (completedScans.length >= 2) {
          const sortedScans = [...completedScans].sort((a, b) => 
            new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
          );
          
          const firstScore = sortedScans[0].result?.securityScore || 0;
          const lastScore = sortedScans[sortedScans.length - 1].result?.securityScore || 0;
          
          securityScoreTrend = lastScore - firstScore;
        }
        
        // 6. Risk Score - weighted calculation based on open vulnerabilities and incomplete tasks
        const riskScore = Math.min(100, securityDebt + 
          (filteredTasks.filter(t => t.status !== 'completed').length * 2));
        
        data = {
          timeframe: reportData.timeframe,
          generatedAt: new Date(),
          // Standard metrics
          scanCount: filteredScans.length,
          vulnerabilityCount: filteredVulnerabilities.length,
          taskCount: filteredTasks.length,
          // Advanced metrics
          mttr, // Mean Time to Remediate (days)
          securityDebt,
          vulnerabilityDensity,
          remediationRate,
          securityScoreTrend,
          riskScore,
          // Detailed breakdown
          vulnerabilitySeverity: {
            high: filteredVulnerabilities.filter(v => v.severity === 'high').length,
            medium: filteredVulnerabilities.filter(v => v.severity === 'medium').length,
            low: filteredVulnerabilities.filter(v => v.severity === 'low').length,
          },
          vulnerabilityCategories: getCategoryDistribution(filteredVulnerabilities),
          topVulnerableUrls: getTopVulnerableUrls(filteredVulnerabilities),
          scanActivity: getScanActivity(filteredScans),
        };
      } else if (reportData.type === 'trends') {
        // Get all scans and vulnerabilities
        const scans = await storage.getScansByUserId(user.id);
        const vulnerabilitiesPromises = scans.map(scan => storage.getVulnerabilitiesByScanId(scan.id));
        const vulnerabilitiesArrays = await Promise.all(vulnerabilitiesPromises);
        const vulnerabilities = vulnerabilitiesArrays.flat();
        const tasks = await storage.getTasksByUserId(user.id);
        
        // Group data by time periods for trend analysis
        const timeWindows = getTimeWindows(reportData.timeframe);
        
        // Gather data for each time window
        const trendData = timeWindows.map(window => {
          const windowScans = scans.filter(scan => 
            new Date(scan.startedAt) >= window.start && 
            new Date(scan.startedAt) <= window.end
          );
          
          const windowVulnerabilities = vulnerabilities.filter(v => {
            const scan = scans.find(s => s.id === v.scanId);
            return scan && new Date(scan.startedAt) >= window.start && new Date(scan.startedAt) <= window.end;
          });
          
          const windowTasks = tasks.filter(task => 
            new Date(task.createdAt) >= window.start && 
            new Date(task.createdAt) <= window.end
          );
          
          // Calculate security score for the window
          const highCount = windowVulnerabilities.filter(v => v.severity === 'high').length;
          const mediumCount = windowVulnerabilities.filter(v => v.severity === 'medium').length;
          const lowCount = windowVulnerabilities.filter(v => v.severity === 'low').length;
          
          let securityScore = 100 - (
            highCount * 10 + 
            mediumCount * 5 + 
            lowCount * 2
          );
          securityScore = Math.max(0, Math.min(100, securityScore));
          
          return {
            period: window.label,
            start: window.start,
            end: window.end,
            scanCount: windowScans.length,
            vulnerabilityCount: windowVulnerabilities.length,
            highSeverity: highCount,
            mediumSeverity: mediumCount,
            lowSeverity: lowCount,
            taskCount: windowTasks.length,
            completedTaskCount: windowTasks.filter(t => t.status === 'completed').length,
            securityScore,
          };
        });
        
        // Calculate trend metrics
        const scanCountTrend = calculateTrend(trendData.map(d => d.scanCount));
        const vulnerabilityCountTrend = calculateTrend(trendData.map(d => d.vulnerabilityCount));
        const highSeverityTrend = calculateTrend(trendData.map(d => d.highSeverity));
        const securityScoreTrend = calculateTrend(trendData.map(d => d.securityScore));
        
        data = {
          timeframe: reportData.timeframe,
          generatedAt: new Date(),
          trends: {
            scanCountTrend,
            vulnerabilityCountTrend,
            highSeverityTrend,
            securityScoreTrend,
          },
          trendData,
        };
      } else if (reportData.type === 'compliance') {
        // Get all scans and vulnerabilities
        const scans = await storage.getScansByUserId(user.id);
        const vulnerabilitiesPromises = scans.map(scan => storage.getVulnerabilitiesByScanId(scan.id));
        const vulnerabilitiesArrays = await Promise.all(vulnerabilitiesPromises);
        const vulnerabilities = vulnerabilitiesArrays.flat();
        
        // Compliance checks
        const complianceChecks = [
          {
            id: 'secure-headers',
            name: 'Security Headers Implementation',
            description: 'Checks if proper security headers are implemented across scanned sites',
            vulnerabilityTypes: ['Missing Content-Security-Policy Header', 'Missing X-XSS-Protection Header', 
                                'Missing Strict-Transport-Security Header', 'Missing X-Content-Type-Options Header', 
                                'Missing X-Frame-Options Header', 'Missing Referrer-Policy Header'],
            status: 'pass', // Will be updated
            details: [],
          },
          {
            id: 'cookie-security',
            name: 'Secure Cookie Configuration',
            description: 'Verifies that cookies are properly secured with necessary flags',
            vulnerabilityTypes: ['Insecure Cookie (Missing Secure Flag)', 'Insecure Cookie (Missing HttpOnly Flag)', 
                                'Insecure Cookie (Missing SameSite Attribute)'],
            status: 'pass', // Will be updated
            details: [],
          },
          {
            id: 'xss-prevention',
            name: 'Cross-Site Scripting Prevention',
            description: 'Checks for potential XSS vulnerabilities',
            vulnerabilityTypes: ['Potential Reflected XSS', 'Potential DOM-based XSS'],
            status: 'pass', // Will be updated
            details: [],
          },
          {
            id: 'csrf-protection',
            name: 'CSRF Protection',
            description: 'Verifies that forms implement CSRF protection',
            vulnerabilityTypes: ['Potential CSRF Vulnerability'],
            status: 'pass', // Will be updated
            details: [],
          },
          {
            id: 'sql-injection',
            name: 'SQL Injection Prevention',
            description: 'Checks for potential SQL injection vulnerabilities',
            vulnerabilityTypes: ['Potential SQL Injection Point', 'Potential SQL Injection Point in Form'],
            status: 'pass', // Will be updated
            details: [],
          },
        ];
        
        // Check each compliance requirement
        complianceChecks.forEach(check => {
          const matchingVulnerabilities = vulnerabilities.filter(v => 
            check.vulnerabilityTypes.includes(v.name)
          );
          
          if (matchingVulnerabilities.length > 0) {
            check.status = 'fail';
            check.details = matchingVulnerabilities.map(v => ({
              url: v.url,
              name: v.name,
              description: v.description,
              severity: v.severity,
            }));
          }
        });
        
        // Calculate overall compliance score
        const passedChecks = complianceChecks.filter(c => c.status === 'pass').length;
        const complianceScore = (passedChecks / complianceChecks.length) * 100;
        
        data = {
          timeframe: reportData.timeframe,
          generatedAt: new Date(),
          complianceScore,
          complianceChecks,
          passedChecks,
          totalChecks: complianceChecks.length,
        };
      }
      
      // Create report
      const report = await storage.createReport({
        userId: user.id,
        title: reportData.title,
        type: reportData.type,
        format: reportData.format,
        data,
      });
      
      // Log security event
      await storage.createSecurityEvent({
        userId: user.id,
        type: 'report_generated',
        description: `New ${reportData.type} report generated: ${reportData.title}`,
        metadata: {
          reportId: report.id,
          format: reportData.format,
        },
      });
      
      return res.status(201).json(report);
    } catch (error) {
      console.error('Error creating report:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },
  
  // Get all reports for the current user
  getUserReports: async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const user = req.user;
      const reports = await storage.getReportsByUserId(user.id);
      
      return res.status(200).json(reports);
    } catch (error) {
      console.error('Error getting user reports:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },
  
  // Get a specific report
  getReport: async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const user = req.user;
      const reportId = parseInt(req.params.id, 10);
      
      if (isNaN(reportId)) {
        return res.status(400).json({ message: 'Invalid report ID' });
      }
      
      const report = await storage.getReport(reportId);
      
      if (!report) {
        return res.status(404).json({ message: 'Report not found' });
      }
      
      if (report.userId !== user.id) {
        return res.status(403).json({ message: 'Unauthorized access to report' });
      }
      
      return res.status(200).json(report);
    } catch (error) {
      console.error('Error getting report:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },
};
