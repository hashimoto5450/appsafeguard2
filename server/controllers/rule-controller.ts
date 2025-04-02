import { Request, Response } from 'express';
import { storage } from '../storage';
import { z } from 'zod';

// Validate rule creation request
const createRuleSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(3).max(1000),
  category: z.string().min(1).max(100),
  pattern: z.string().min(1).max(1000),
  severity: z.enum(['high', 'medium', 'low']),
  enabled: z.boolean().default(true),
});

// Validate rule update request
const updateRuleSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().min(3).max(1000).optional(),
  category: z.string().min(1).max(100).optional(),
  pattern: z.string().min(1).max(1000).optional(),
  severity: z.enum(['high', 'medium', 'low']).optional(),
  enabled: z.boolean().optional(),
});

export const ruleController = {
  // Create a new custom rule
  createRule: async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const user = req.user;
      
      // Validate request data
      const validation = createRuleSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: 'Invalid rule data', errors: validation.error.errors });
      }
      
      const ruleData = validation.data;
      
      // Check if pattern is a valid regex
      try {
        new RegExp(ruleData.pattern);
      } catch (error) {
        return res.status(400).json({ message: 'Invalid regex pattern' });
      }
      
      // Create rule
      const rule = await storage.createCustomRule({
        ...ruleData,
        userId: user.id,
      });
      
      // Log security event
      await storage.createSecurityEvent({
        userId: user.id,
        type: 'rule_created',
        description: `New custom rule created: ${ruleData.name}`,
        metadata: {
          ruleId: rule.id,
          pattern: ruleData.pattern,
          severity: ruleData.severity,
        },
      });
      
      return res.status(201).json(rule);
    } catch (error) {
      console.error('Error creating rule:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },
  
  // Get all custom rules for the current user
  getUserRules: async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const user = req.user;
      const rules = await storage.getCustomRulesByUserId(user.id);
      
      return res.status(200).json(rules);
    } catch (error) {
      console.error('Error getting user rules:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },
  
  // Get a specific custom rule
  getRule: async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const user = req.user;
      const ruleId = parseInt(req.params.id, 10);
      
      if (isNaN(ruleId)) {
        return res.status(400).json({ message: 'Invalid rule ID' });
      }
      
      const rule = await storage.getCustomRule(ruleId);
      
      if (!rule) {
        return res.status(404).json({ message: 'Rule not found' });
      }
      
      if (rule.userId !== user.id) {
        return res.status(403).json({ message: 'Unauthorized access to rule' });
      }
      
      return res.status(200).json(rule);
    } catch (error) {
      console.error('Error getting rule:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },
  
  // Update a custom rule
  updateRule: async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const user = req.user;
      const ruleId = parseInt(req.params.id, 10);
      
      if (isNaN(ruleId)) {
        return res.status(400).json({ message: 'Invalid rule ID' });
      }
      
      // Validate request data
      const validation = updateRuleSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: 'Invalid update data', errors: validation.error.errors });
      }
      
      const updateData = validation.data;
      
      const rule = await storage.getCustomRule(ruleId);
      
      if (!rule) {
        return res.status(404).json({ message: 'Rule not found' });
      }
      
      if (rule.userId !== user.id) {
        return res.status(403).json({ message: 'Unauthorized access to rule' });
      }
      
      // If pattern is provided, check if it's a valid regex
      if (updateData.pattern) {
        try {
          new RegExp(updateData.pattern);
        } catch (error) {
          return res.status(400).json({ message: 'Invalid regex pattern' });
        }
      }
      
      // Update rule
      const updatedRule = await storage.updateCustomRule(ruleId, updateData);
      
      return res.status(200).json(updatedRule);
    } catch (error) {
      console.error('Error updating rule:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },
};
