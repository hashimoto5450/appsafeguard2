import { Request, Response } from 'express';
import { storage } from '../storage';
import { runScan } from '../utils/scan-utils';
import { z } from 'zod';
import { insertScanSchema, User, InsertScan, Scan } from '@shared/schema';
import { fromZodError } from 'zod-validation-error';

// Validate scan request
const scanRequestSchema = z.object({
  url: z.string().url('Invalid URL'),
  scanLevel: z.enum(['quick', 'standard', 'detailed']),
  crawlLimit: z.number().int().positive(),
  useAuthentication: z.boolean().optional().default(false),
  includeCustomRules: z.boolean().optional().default(false),
});

export const scanController = {
  // Delete scan results by ID
  deleteScan: async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const user = req.user;
      const scanId = parseInt(req.params.id, 10);
      
      if (isNaN(scanId)) {
        return res.status(400).json({ message: 'Invalid scan ID' });
      }
      
      // スキャンが存在し、そのユーザーのものであることを確認
      const scan = await storage.getScan(scanId);
      
      if (!scan) {
        return res.status(404).json({ message: 'Scan not found' });
      }
      
      if (scan.userId !== user.id) {
        return res.status(403).json({ message: 'Unauthorized access to scan' });
      }
      
      // スキャンと関連する脆弱性を削除
      await storage.deleteScan(scanId);
      
      // 削除を記録
      await storage.createSecurityEvent({
        userId: user.id,
        type: 'scan_deleted',
        description: `Scan deleted for ${scan.url}`,
        metadata: {
          scanId: scanId,
        },
      });
      
      return res.status(200).json({ message: 'Scan deleted successfully' });
    } catch (error) {
      console.error('Error deleting scan:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Delete all scan results for the current user
  deleteAllScans: async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const user = req.user;
      
      // ユーザーのすべてのスキャンと関連データを削除
      await storage.deleteAllScansByUserId(user.id);
      
      // 削除を記録
      await storage.createSecurityEvent({
        userId: user.id,
        type: 'all_scans_deleted',
        description: `All scans deleted for user ${user.username}`,
      });
      
      return res.status(200).json({ message: 'All scans deleted successfully' });
    } catch (error) {
      console.error('Error deleting all scans:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },
  
  // Create a new scan
  createScan: async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const user = req.user;
      
      // Validate scan request data
      const validation = scanRequestSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: 'Invalid scan parameters', errors: validation.error.errors });
      }
      
      const scanData = validation.data;
      
      // Create scan record
      const scan = await storage.createScan({
        userId: user.id,
        url: scanData.url,
        scanLevel: scanData.scanLevel,
        crawlLimit: scanData.crawlLimit,
        useAuthentication: scanData.useAuthentication,
        includeCustomRules: scanData.includeCustomRules,
        status: 'pending',
      });
      
      // Return the scan immediately so the client can see it's pending
      res.status(201).json(scan);
      
      // 開始時間を記録して、scan.startedAtの可能性のあるnull問題を回避
      const startTime = new Date();
      
      // Start scanning process (async) - Don't use setTimeout as it can be unreliable
      (async function doScan(scanObj, scanDataObj, userObj, startTimeObj) {
        try {
          console.log(`Starting scan #${scanObj.id} for ${scanDataObj.url}`);
          
          // Update scan status to running and set startedAt
          await storage.updateScan(scanObj.id, { 
            status: 'running',
            startedAt: startTimeObj
          });
          
          // Get custom rules if needed
          let customRules: any[] = [];
          if (scanDataObj.includeCustomRules) {
            customRules = await storage.getCustomRulesByUserId(userObj.id);
          }
          
          // Run the scan - pass a limited crawl count for demo purposes
          const scanResult = await runScan({
            url: scanDataObj.url,
            scanLevel: scanDataObj.scanLevel,
            crawlLimit: Math.min(scanDataObj.crawlLimit, 5), // Limit to 5 pages for demo
            useAuthentication: scanDataObj.useAuthentication,
            includeCustomRules: scanDataObj.includeCustomRules,
            customRules,
          });
          
          console.log(`Scan #${scanObj.id} completed. Found ${scanResult.vulnerabilities.length} vulnerabilities.`);
          
          // Store vulnerabilities
          for (const vulnerability of scanResult.vulnerabilities) {
            await storage.createVulnerability({
              ...vulnerability,
              scanId: scanObj.id,
            });
          }
          
          // Calculate scan duration in seconds
          const scanDuration = (new Date().getTime() - startTimeObj.getTime()) / 1000;
          
          // Update scan with detailed results and summary
          await storage.updateScan(scanObj.id, {
            status: 'completed',
            completedAt: new Date(),
            result: {
              summary: scanResult.summary,
              scannedUrls: scanResult.scannedUrls,
              scanLevel: scanDataObj.scanLevel,
              scanDuration: scanDuration,
              totalPages: scanResult.scannedUrls.length,
              vulnerabilitiesCount: scanResult.vulnerabilities.length,
              timestamp: new Date().toISOString(),
            },
          });
          
          // Log security event
          await storage.createSecurityEvent({
            userId: userObj.id,
            type: 'scan_completed',
            description: `Scan completed for ${scanDataObj.url}`,
            metadata: {
              scanId: scanObj.id,
              vulnerabilities: scanResult.summary,
            },
          });
        } catch (error: any) {
          console.error('Scan error:', error);
          
          const errorMessage = error && typeof error.message === 'string' 
            ? error.message 
            : 'Unknown error occurred';
          
          // Calculate scan duration in seconds even in error case
          const scanDuration = (new Date().getTime() - startTimeObj.getTime()) / 1000;
          
          // Update scan status to failed with detailed error information
          await storage.updateScan(scanObj.id, {
            status: 'failed',
            completedAt: new Date(),
            result: { 
              error: errorMessage,
              scanLevel: scanDataObj.scanLevel,
              scanDuration: scanDuration,
              url: scanDataObj.url,
              timestamp: new Date().toISOString(),
              failureReason: error.code || 'UNKNOWN_ERROR',
              stackTrace: error.stack || 'No stack trace available',
            },
          });
          
          // Log security event
          await storage.createSecurityEvent({
            userId: userObj.id,
            type: 'scan_failed',
            description: `Scan failed for ${scanDataObj.url}: ${errorMessage}`,
            metadata: {
              scanId: scanObj.id,
              error: errorMessage,
            },
          });
        }
      })(scan, scanData, user, startTime);
    } catch (error) {
      console.error('Error creating scan:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },
  
  // Get scan by ID
  getScan: async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const user = req.user;
      const scanId = parseInt(req.params.id, 10);
      
      if (isNaN(scanId)) {
        return res.status(400).json({ message: 'Invalid scan ID' });
      }
      
      const scan = await storage.getScan(scanId);
      
      if (!scan) {
        return res.status(404).json({ message: 'Scan not found' });
      }
      
      if (scan.userId !== user.id) {
        return res.status(403).json({ message: 'Unauthorized access to scan' });
      }
      
      return res.status(200).json(scan);
    } catch (error) {
      console.error('Error getting scan:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },
  
  // Get all scans for the current user
  getUserScans: async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const user = req.user;
      const scans = await storage.getScansByUserId(user.id);
      
      return res.status(200).json(scans);
    } catch (error) {
      console.error('Error getting user scans:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },
  
  // Get vulnerabilities for a scan
  getScanVulnerabilities: async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const user = req.user;
      const scanId = parseInt(req.params.id, 10);
      
      if (isNaN(scanId)) {
        return res.status(400).json({ message: 'Invalid scan ID' });
      }
      
      const scan = await storage.getScan(scanId);
      
      if (!scan) {
        return res.status(404).json({ message: 'Scan not found' });
      }
      
      if (scan.userId !== user.id) {
        return res.status(403).json({ message: 'Unauthorized access to scan' });
      }
      
      const vulnerabilities = await storage.getVulnerabilitiesByScanId(scanId);
      
      return res.status(200).json(vulnerabilities);
    } catch (error) {
      console.error('Error getting scan vulnerabilities:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },
};
