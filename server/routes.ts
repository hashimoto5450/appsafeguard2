import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { scanController } from "./controllers/scan-controller";
import { vulnerabilityController } from "./controllers/vulnerability-controller";
import { taskController } from "./controllers/task-controller";
import { ruleController } from "./controllers/rule-controller";
import { reportController } from "./controllers/report-controller";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Security activity routes
  app.get("/api/dashboard", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    res.json({
      message: "You are authenticated",
      user: req.user,
    });
  });
  
  // Scan routes
  app.post("/api/scans", scanController.createScan);
  app.get("/api/scans", scanController.getUserScans);
  app.get("/api/scans/:id", scanController.getScan);
  app.get("/api/scans/:id/vulnerabilities", scanController.getScanVulnerabilities);
  app.delete("/api/scans/:id", scanController.deleteScan);
  app.delete("/api/scans", scanController.deleteAllScans);
  
  // Vulnerability routes
  app.get("/api/vulnerabilities", vulnerabilityController.getUserVulnerabilities);
  app.get("/api/vulnerabilities/summary", vulnerabilityController.getVulnerabilitySummary);
  app.get("/api/vulnerabilities/:id", vulnerabilityController.getVulnerability);
  app.patch("/api/vulnerabilities/:id", vulnerabilityController.updateVulnerability);
  
  // Task routes
  app.post("/api/tasks", taskController.createTask);
  app.get("/api/tasks", taskController.getUserTasks);
  app.get("/api/tasks/summary", taskController.getTaskSummary);
  app.get("/api/tasks/:id", taskController.getTask);
  app.patch("/api/tasks/:id", taskController.updateTask);
  app.get("/api/vulnerabilities/:vulnerabilityId/tasks", taskController.getVulnerabilityTasks);
  
  // Custom rule routes
  app.post("/api/rules", ruleController.createRule);
  app.get("/api/rules", ruleController.getUserRules);
  app.get("/api/rules/:id", ruleController.getRule);
  app.patch("/api/rules/:id", ruleController.updateRule);
  
  // Report routes
  app.post("/api/reports", reportController.createReport);
  app.get("/api/reports", reportController.getUserReports);
  app.get("/api/reports/metrics", reportController.getMetrics);
  app.get("/api/reports/trends", reportController.getTrends);
  app.get("/api/reports/:id", reportController.getReport);

  const httpServer = createServer(app);

  return httpServer;
}
