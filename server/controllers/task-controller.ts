import { Request, Response } from 'express';
import { storage } from '../storage';
import { z } from 'zod';

// Validate task creation request
const createTaskSchema = z.object({
  vulnerabilityId: z.number().int().optional(),
  title: z.string().min(3).max(100),
  description: z.string().min(3).max(1000),
  status: z.enum(['pending', 'in_progress', 'completed', 'deferred']).default('pending'),
  assignedTo: z.number().int().optional(),
  dueDate: z.string().optional().refine(val => {
    if (!val) return true;
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, { message: 'Invalid date format' }),
});

// Validate task update request
const updateTaskSchema = z.object({
  title: z.string().min(3).max(100).optional(),
  description: z.string().min(3).max(1000).optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'deferred']).optional(),
  assignedTo: z.number().int().optional().nullable(),
  dueDate: z.string().optional().nullable().refine(val => {
    if (!val) return true;
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, { message: 'Invalid date format' }),
});

export const taskController = {
  // Create a new task
  createTask: async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const user = req.user;
      
      // Validate request data
      const validation = createTaskSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: 'Invalid task data', errors: validation.error.errors });
      }
      
      const taskData = validation.data;
      
      // If vulnerabilityId is provided, verify ownership
      if (taskData.vulnerabilityId) {
        const vulnerability = await storage.getVulnerability(taskData.vulnerabilityId);
        
        if (!vulnerability) {
          return res.status(404).json({ message: 'Vulnerability not found' });
        }
        
        // Check if the vulnerability belongs to the user's scan
        const scan = await storage.getScan(vulnerability.scanId);
        
        if (!scan || scan.userId !== user.id) {
          return res.status(403).json({ message: 'Unauthorized access to vulnerability' });
        }
      }
      
      // Convert dueDate string to Date object if provided
      const dueDate = taskData.dueDate ? new Date(taskData.dueDate) : undefined;
      
      // Create task
      const task = await storage.createTask({
        ...taskData,
        dueDate,
        userId: user.id,
      });
      
      // Log security event
      await storage.createSecurityEvent({
        userId: user.id,
        type: 'task_created',
        description: `New remediation task created: ${taskData.title}`,
        metadata: {
          taskId: task.id,
          vulnerabilityId: taskData.vulnerabilityId,
        },
      });
      
      return res.status(201).json(task);
    } catch (error) {
      console.error('Error creating task:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },
  
  // Get all tasks for the current user
  getUserTasks: async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const user = req.user;
      const tasks = await storage.getTasksByUserId(user.id);
      
      return res.status(200).json(tasks);
    } catch (error) {
      console.error('Error getting user tasks:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },
  
  // Get a specific task
  getTask: async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const user = req.user;
      const taskId = parseInt(req.params.id, 10);
      
      if (isNaN(taskId)) {
        return res.status(400).json({ message: 'Invalid task ID' });
      }
      
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
      
      if (task.userId !== user.id) {
        return res.status(403).json({ message: 'Unauthorized access to task' });
      }
      
      return res.status(200).json(task);
    } catch (error) {
      console.error('Error getting task:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },
  
  // Update a task
  updateTask: async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const user = req.user;
      const taskId = parseInt(req.params.id, 10);
      
      if (isNaN(taskId)) {
        return res.status(400).json({ message: 'Invalid task ID' });
      }
      
      // Validate request data
      const validation = updateTaskSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: 'Invalid update data', errors: validation.error.errors });
      }
      
      const updateData = validation.data;
      
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
      
      if (task.userId !== user.id) {
        return res.status(403).json({ message: 'Unauthorized access to task' });
      }
      
      // Convert dueDate string to Date object if provided
      let dueDate = undefined;
      if (updateData.dueDate === null) {
        dueDate = null;
      } else if (updateData.dueDate) {
        dueDate = new Date(updateData.dueDate);
      }
      
      // Update task
      const updatedTask = await storage.updateTask(taskId, {
        ...updateData,
        dueDate,
      });
      
      // If status changed to completed, log security event
      if (updateData.status === 'completed' && task.status !== 'completed') {
        await storage.createSecurityEvent({
          userId: user.id,
          type: 'task_completed',
          description: `Remediation task completed: ${task.title}`,
          metadata: {
            taskId,
            vulnerabilityId: task.vulnerabilityId,
          },
        });
        
        // If task is linked to a vulnerability, update the vulnerability status to fixed
        if (task.vulnerabilityId) {
          await storage.updateVulnerability(task.vulnerabilityId, {
            status: 'fixed',
            updatedAt: new Date(),
          });
        }
      }
      
      return res.status(200).json(updatedTask);
    } catch (error) {
      console.error('Error updating task:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },
  
  // Get tasks for a vulnerability
  getVulnerabilityTasks: async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const user = req.user;
      const vulnerabilityId = parseInt(req.params.vulnerabilityId, 10);
      
      if (isNaN(vulnerabilityId)) {
        return res.status(400).json({ message: 'Invalid vulnerability ID' });
      }
      
      const vulnerability = await storage.getVulnerability(vulnerabilityId);
      
      if (!vulnerability) {
        return res.status(404).json({ message: 'Vulnerability not found' });
      }
      
      // Check if the vulnerability belongs to the user's scan
      const scan = await storage.getScan(vulnerability.scanId);
      
      if (!scan || scan.userId !== user.id) {
        return res.status(403).json({ message: 'Unauthorized access to vulnerability' });
      }
      
      const tasks = await storage.getTasksByVulnerabilityId(vulnerabilityId);
      
      return res.status(200).json(tasks);
    } catch (error) {
      console.error('Error getting vulnerability tasks:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },
  
  // Get task summary
  getTaskSummary: async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const user = req.user;
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
      
      return res.status(200).json(summary);
    } catch (error) {
      console.error('Error getting task summary:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },
};
