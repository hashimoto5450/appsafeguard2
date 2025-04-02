import { 
  users, type User, type InsertUser,
  scans, type Scan, type InsertScan,
  vulnerabilities, type Vulnerability, type InsertVulnerability,
  tasks, type Task, type InsertTask,
  customRules, type CustomRule, type InsertCustomRule,
  reports, type Report, type InsertReport,
  securityEvents, type SecurityEvent, type InsertSecurityEvent
} from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { eq, and } from 'drizzle-orm';
import { db, pool } from './db';

// Storage interface for all CRUD operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  
  // Scan operations
  createScan(scan: InsertScan): Promise<Scan>;
  getScan(id: number): Promise<Scan | undefined>;
  getScansByUserId(userId: number): Promise<Scan[]>;
  updateScan(id: number, updates: Partial<Scan>): Promise<Scan | undefined>;
  deleteScan(id: number): Promise<boolean>;
  deleteAllScansByUserId(userId: number): Promise<boolean>;
  
  // Vulnerability operations
  createVulnerability(vulnerability: InsertVulnerability): Promise<Vulnerability>;
  getVulnerability(id: number): Promise<Vulnerability | undefined>;
  getVulnerabilitiesByScanId(scanId: number): Promise<Vulnerability[]>;
  updateVulnerability(id: number, updates: Partial<Vulnerability>): Promise<Vulnerability | undefined>;
  deleteVulnerabilitiesByScanId(scanId: number): Promise<boolean>;
  
  // Task operations
  createTask(task: InsertTask): Promise<Task>;
  getTask(id: number): Promise<Task | undefined>;
  getTasksByUserId(userId: number): Promise<Task[]>;
  getTasksByVulnerabilityId(vulnerabilityId: number): Promise<Task[]>;
  updateTask(id: number, updates: Partial<Task>): Promise<Task | undefined>;
  
  // Custom rule operations
  createCustomRule(rule: InsertCustomRule): Promise<CustomRule>;
  getCustomRule(id: number): Promise<CustomRule | undefined>;
  getCustomRulesByUserId(userId: number): Promise<CustomRule[]>;
  updateCustomRule(id: number, updates: Partial<CustomRule>): Promise<CustomRule | undefined>;
  
  // Report operations
  createReport(report: InsertReport): Promise<Report>;
  getReport(id: number): Promise<Report | undefined>;
  getReportsByUserId(userId: number): Promise<Report[]>;
  
  // Security event operations
  createSecurityEvent(event: InsertSecurityEvent): Promise<SecurityEvent>;
  getSecurityEventsByUserId(userId: number): Promise<SecurityEvent[]>;
  
  // Session store
  sessionStore: session.Store;
}

const MemoryStore = createMemoryStore(session);

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private scans: Map<number, Scan>;
  private vulnerabilities: Map<number, Vulnerability>;
  private tasks: Map<number, Task>;
  private customRules: Map<number, CustomRule>;
  private reports: Map<number, Report>;
  private securityEvents: Map<number, SecurityEvent>;
  
  public sessionStore: session.Store;
  
  private userId: number;
  private scanId: number;
  private vulnerabilityId: number;
  private taskId: number;
  private customRuleId: number;
  private reportId: number;
  private securityEventId: number;

  constructor() {
    this.users = new Map();
    this.scans = new Map();
    this.vulnerabilities = new Map();
    this.tasks = new Map();
    this.customRules = new Map();
    this.reports = new Map();
    this.securityEvents = new Map();
    
    this.userId = 1;
    this.scanId = 1;
    this.vulnerabilityId = 1;
    this.taskId = 1;
    this.customRuleId = 1;
    this.reportId = 1;
    this.securityEventId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every day
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const createdAt = new Date();
    // Set default values for required fields that might be undefined in insertUser
    const role = insertUser.role || 'user';
    const user: User = { 
      ...insertUser, 
      id, 
      role,
      createdAt 
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Scan operations
  async createScan(insertScan: InsertScan): Promise<Scan> {
    const id = this.scanId++;
    const startedAt = new Date();
    // Set default values for required fields that might be undefined in insertScan
    const useAuthentication = insertScan.useAuthentication !== undefined ? insertScan.useAuthentication : false;
    const includeCustomRules = insertScan.includeCustomRules !== undefined ? insertScan.includeCustomRules : false;
    
    const scan: Scan = { 
      ...insertScan, 
      id, 
      startedAt, 
      completedAt: null, 
      result: null,
      useAuthentication,
      includeCustomRules
    };
    this.scans.set(id, scan);
    return scan;
  }
  
  async getScan(id: number): Promise<Scan | undefined> {
    return this.scans.get(id);
  }
  
  async getScansByUserId(userId: number): Promise<Scan[]> {
    return Array.from(this.scans.values()).filter(
      (scan) => scan.userId === userId,
    );
  }
  
  async updateScan(id: number, updates: Partial<Scan>): Promise<Scan | undefined> {
    const scan = this.scans.get(id);
    if (!scan) return undefined;
    
    const updatedScan = { ...scan, ...updates };
    this.scans.set(id, updatedScan);
    return updatedScan;
  }

  async deleteScan(id: number): Promise<boolean> {
    // スキャン自体を削除
    const deleted = this.scans.delete(id);
    
    // 関連する脆弱性を削除
    await this.deleteVulnerabilitiesByScanId(id);
    
    return deleted;
  }

  async deleteAllScansByUserId(userId: number): Promise<boolean> {
    // ユーザーに紐づくすべてのスキャンを見つける
    const userScans = await this.getScansByUserId(userId);
    
    // 各スキャンとその関連データを削除
    for (const scan of userScans) {
      await this.deleteScan(scan.id);
    }
    
    return true;
  }
  
  // Vulnerability operations
  async createVulnerability(insertVulnerability: InsertVulnerability): Promise<Vulnerability> {
    const id = this.vulnerabilityId++;
    const createdAt = new Date();
    // Set default values for required fields that might be undefined in insertVulnerability
    const status = insertVulnerability.status || 'open';
    const details = insertVulnerability.details || null;
    
    const vulnerability: Vulnerability = { 
      ...insertVulnerability, 
      id, 
      createdAt, 
      updatedAt: createdAt,
      status,
      details
    };
    this.vulnerabilities.set(id, vulnerability);
    return vulnerability;
  }
  
  async getVulnerability(id: number): Promise<Vulnerability | undefined> {
    return this.vulnerabilities.get(id);
  }
  
  async getVulnerabilitiesByScanId(scanId: number): Promise<Vulnerability[]> {
    return Array.from(this.vulnerabilities.values()).filter(
      (vulnerability) => vulnerability.scanId === scanId,
    );
  }
  
  async updateVulnerability(id: number, updates: Partial<Vulnerability>): Promise<Vulnerability | undefined> {
    const vulnerability = this.vulnerabilities.get(id);
    if (!vulnerability) return undefined;
    
    const updatedVulnerability = { 
      ...vulnerability, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.vulnerabilities.set(id, updatedVulnerability);
    return updatedVulnerability;
  }

  async deleteVulnerabilitiesByScanId(scanId: number): Promise<boolean> {
    // 特定のスキャンIDに関連するすべての脆弱性を取得
    const vulnerabilities = await this.getVulnerabilitiesByScanId(scanId);
    
    // 各脆弱性を削除
    for (const vulnerability of vulnerabilities) {
      this.vulnerabilities.delete(vulnerability.id);
    }
    
    return true;
  }
  
  // Task operations
  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.taskId++;
    const createdAt = new Date();
    // Set default values for required fields that might be undefined in insertTask
    const status = insertTask.status || 'pending';
    const vulnerabilityId = insertTask.vulnerabilityId !== undefined ? insertTask.vulnerabilityId : null;
    const assignedTo = insertTask.assignedTo !== undefined ? insertTask.assignedTo : null;
    const dueDate = insertTask.dueDate !== undefined ? insertTask.dueDate : null;
    
    const task: Task = { 
      ...insertTask, 
      id, 
      createdAt, 
      updatedAt: createdAt,
      status,
      vulnerabilityId,
      assignedTo,
      dueDate
    };
    this.tasks.set(id, task);
    return task;
  }
  
  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }
  
  async getTasksByUserId(userId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.userId === userId,
    );
  }
  
  async getTasksByVulnerabilityId(vulnerabilityId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.vulnerabilityId === vulnerabilityId,
    );
  }
  
  async updateTask(id: number, updates: Partial<Task>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    
    const updatedTask = { 
      ...task, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }
  
  // Custom rule operations
  async createCustomRule(insertRule: InsertCustomRule): Promise<CustomRule> {
    const id = this.customRuleId++;
    const createdAt = new Date();
    // Set default values for required fields that might be undefined in insertRule
    const enabled = insertRule.enabled !== undefined ? insertRule.enabled : true;
    
    const rule: CustomRule = { 
      ...insertRule, 
      id, 
      createdAt, 
      updatedAt: createdAt,
      enabled
    };
    this.customRules.set(id, rule);
    return rule;
  }
  
  async getCustomRule(id: number): Promise<CustomRule | undefined> {
    return this.customRules.get(id);
  }
  
  async getCustomRulesByUserId(userId: number): Promise<CustomRule[]> {
    return Array.from(this.customRules.values()).filter(
      (rule) => rule.userId === userId,
    );
  }
  
  async updateCustomRule(id: number, updates: Partial<CustomRule>): Promise<CustomRule | undefined> {
    const rule = this.customRules.get(id);
    if (!rule) return undefined;
    
    const updatedRule = { 
      ...rule, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.customRules.set(id, updatedRule);
    return updatedRule;
  }
  
  // Report operations
  async createReport(insertReport: InsertReport): Promise<Report> {
    const id = this.reportId++;
    const createdAt = new Date();
    // Set default values for required fields that might be undefined in insertReport
    const data = insertReport.data || null;
    const format = insertReport.format || 'json';
    
    const report: Report = { 
      ...insertReport, 
      id, 
      createdAt,
      data,
      format
    };
    this.reports.set(id, report);
    return report;
  }
  
  async getReport(id: number): Promise<Report | undefined> {
    return this.reports.get(id);
  }
  
  async getReportsByUserId(userId: number): Promise<Report[]> {
    return Array.from(this.reports.values()).filter(
      (report) => report.userId === userId,
    );
  }
  
  // Security event operations
  async createSecurityEvent(insertEvent: InsertSecurityEvent): Promise<SecurityEvent> {
    const id = this.securityEventId++;
    const createdAt = new Date();
    // Set default values for required fields that might be undefined in insertEvent
    const userId = insertEvent.userId !== undefined ? insertEvent.userId : null;
    const metadata = insertEvent.metadata || null;
    
    const event: SecurityEvent = { 
      ...insertEvent, 
      id, 
      createdAt,
      userId,
      metadata
    };
    this.securityEvents.set(id, event);
    return event;
  }
  
  async getSecurityEventsByUserId(userId: number): Promise<SecurityEvent[]> {
    return Array.from(this.securityEvents.values()).filter(
      (event) => !event.userId || event.userId === userId,
    );
  }
}

// PostgreSQL database implementation
const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  private db: typeof db;
  public sessionStore: session.Store;

  constructor() {
    // Use the existing db connection
    this.db = db;

    // Create session store
    this.sessionStore = new PostgresSessionStore({
      pool: pool,
      createTableIfMissing: true,
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await this.db.query.users.findFirst({
      where: eq(users.id, id)
    });
    return result || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.query.users.findFirst({
      where: eq(users.username, username)
    });
    return result || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.query.users.findFirst({
      where: eq(users.email, email)
    });
    return result || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    // Set default values for required fields
    const insertData = {
      ...user,
      role: user.role || 'user',
      createdAt: new Date()
    };
    
    const result = await this.db.insert(users)
      .values(insertData)
      .returning();
    return result[0];
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const result = await this.db.update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return result[0] || undefined;
  }

  // Scan operations
  async createScan(scan: InsertScan): Promise<Scan> {
    // Set default values for required fields
    const insertData = {
      ...scan,
      useAuthentication: scan.useAuthentication !== undefined ? scan.useAuthentication : false,
      includeCustomRules: scan.includeCustomRules !== undefined ? scan.includeCustomRules : false,
      startedAt: new Date(),
      completedAt: null,
      result: null
    };
    
    const result = await this.db.insert(scans)
      .values(insertData)
      .returning();
    return result[0];
  }

  async getScan(id: number): Promise<Scan | undefined> {
    const result = await this.db.query.scans.findFirst({
      where: eq(scans.id, id)
    });
    return result || undefined;
  }

  async getScansByUserId(userId: number): Promise<Scan[]> {
    return await this.db.query.scans.findMany({
      where: eq(scans.userId, userId)
    });
  }

  async updateScan(id: number, updates: Partial<Scan>): Promise<Scan | undefined> {
    const result = await this.db.update(scans)
      .set(updates)
      .where(eq(scans.id, id))
      .returning();
    return result[0] || undefined;
  }

  async deleteScan(id: number): Promise<boolean> {
    // 関連する脆弱性を削除
    await this.deleteVulnerabilitiesByScanId(id);
    
    // スキャン自体を削除
    const result = await this.db.delete(scans)
      .where(eq(scans.id, id))
      .returning();
    
    return result.length > 0;
  }

  async deleteAllScansByUserId(userId: number): Promise<boolean> {
    // ユーザーのスキャンを取得
    const userScans = await this.getScansByUserId(userId);
    
    // 各スキャンとその関連データを削除
    for (const scan of userScans) {
      await this.deleteScan(scan.id);
    }
    
    return true;
  }

  // Vulnerability operations
  async createVulnerability(vulnerability: InsertVulnerability): Promise<Vulnerability> {
    const now = new Date();
    // Set default values for required fields
    const insertData = {
      ...vulnerability,
      status: vulnerability.status || 'open',
      details: vulnerability.details || null,
      createdAt: now,
      updatedAt: now
    };
    
    const result = await this.db.insert(vulnerabilities)
      .values(insertData)
      .returning();
    return result[0];
  }

  async getVulnerability(id: number): Promise<Vulnerability | undefined> {
    const result = await this.db.query.vulnerabilities.findFirst({
      where: eq(vulnerabilities.id, id)
    });
    return result || undefined;
  }

  async getVulnerabilitiesByScanId(scanId: number): Promise<Vulnerability[]> {
    return await this.db.query.vulnerabilities.findMany({
      where: eq(vulnerabilities.scanId, scanId)
    });
  }

  async updateVulnerability(id: number, updates: Partial<Vulnerability>): Promise<Vulnerability | undefined> {
    const result = await this.db.update(vulnerabilities)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(vulnerabilities.id, id))
      .returning();
    return result[0] || undefined;
  }

  async deleteVulnerabilitiesByScanId(scanId: number): Promise<boolean> {
    const result = await this.db.delete(vulnerabilities)
      .where(eq(vulnerabilities.scanId, scanId))
      .returning();
    return true;
  }

  // Task operations
  async createTask(task: InsertTask): Promise<Task> {
    const now = new Date();
    // Set default values for required fields
    const insertData = {
      ...task,
      status: task.status || 'pending',
      vulnerabilityId: task.vulnerabilityId !== undefined ? task.vulnerabilityId : null,
      assignedTo: task.assignedTo !== undefined ? task.assignedTo : null,
      dueDate: task.dueDate !== undefined ? task.dueDate : null,
      createdAt: now,
      updatedAt: now
    };
    
    const result = await this.db.insert(tasks)
      .values(insertData)
      .returning();
    return result[0];
  }

  async getTask(id: number): Promise<Task | undefined> {
    const result = await this.db.query.tasks.findFirst({
      where: eq(tasks.id, id)
    });
    return result || undefined;
  }

  async getTasksByUserId(userId: number): Promise<Task[]> {
    return await this.db.query.tasks.findMany({
      where: eq(tasks.userId, userId)
    });
  }

  async getTasksByVulnerabilityId(vulnerabilityId: number): Promise<Task[]> {
    return await this.db.query.tasks.findMany({
      where: eq(tasks.vulnerabilityId, vulnerabilityId)
    });
  }

  async updateTask(id: number, updates: Partial<Task>): Promise<Task | undefined> {
    const result = await this.db.update(tasks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return result[0] || undefined;
  }

  // Custom rule operations
  async createCustomRule(rule: InsertCustomRule): Promise<CustomRule> {
    const now = new Date();
    // Set default values for required fields
    const insertData = {
      ...rule,
      enabled: rule.enabled !== undefined ? rule.enabled : true,
      createdAt: now,
      updatedAt: now
    };
    
    const result = await this.db.insert(customRules)
      .values(insertData)
      .returning();
    return result[0];
  }

  async getCustomRule(id: number): Promise<CustomRule | undefined> {
    const result = await this.db.query.customRules.findFirst({
      where: eq(customRules.id, id)
    });
    return result || undefined;
  }

  async getCustomRulesByUserId(userId: number): Promise<CustomRule[]> {
    return await this.db.query.customRules.findMany({
      where: eq(customRules.userId, userId)
    });
  }

  async updateCustomRule(id: number, updates: Partial<CustomRule>): Promise<CustomRule | undefined> {
    const result = await this.db.update(customRules)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(customRules.id, id))
      .returning();
    return result[0] || undefined;
  }

  // Report operations
  async createReport(report: InsertReport): Promise<Report> {
    // Set default values for required fields
    const insertData = {
      ...report,
      data: report.data || null,
      format: report.format || 'json',
      createdAt: new Date()
    };
    
    const result = await this.db.insert(reports)
      .values(insertData)
      .returning();
    return result[0];
  }

  async getReport(id: number): Promise<Report | undefined> {
    const result = await this.db.query.reports.findFirst({
      where: eq(reports.id, id)
    });
    return result || undefined;
  }

  async getReportsByUserId(userId: number): Promise<Report[]> {
    return await this.db.query.reports.findMany({
      where: eq(reports.userId, userId)
    });
  }

  // Security event operations
  async createSecurityEvent(event: InsertSecurityEvent): Promise<SecurityEvent> {
    // Set default values for required fields
    const insertData = {
      ...event,
      userId: event.userId !== undefined ? event.userId : null,
      metadata: event.metadata || null,
      createdAt: new Date()
    };
    
    const result = await this.db.insert(securityEvents)
      .values(insertData)
      .returning();
    return result[0];
  }

  async getSecurityEventsByUserId(userId: number): Promise<SecurityEvent[]> {
    return await this.db.query.securityEvents.findMany({
      where: eq(securityEvents.userId, userId)
    });
  }
}

// メモリストレージからデータベースストレージに切り替え
export const storage = new DatabaseStorage();