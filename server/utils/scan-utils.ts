import axios from 'axios';
import * as cheerio from 'cheerio';
import { URL } from 'url';
import { vulnerabilityDetector } from './vulnerability-detector';
import { InsertVulnerability } from '@shared/schema';

interface ScanOptions {
  url: string;
  scanLevel: string;
  crawlLimit: number;
  useAuthentication: boolean;
  includeCustomRules: boolean;
  customRules?: any[];
}

interface ScanResult {
  scannedUrls: string[];
  vulnerabilities: InsertVulnerability[];
  summary: {
    totalVulnerabilities: number;
    highSeverity: number;
    mediumSeverity: number;
    lowSeverity: number;
    securityScore: number;
  };
}

export class Scanner {
  private visited: Set<string> = new Set();
  private queue: string[] = [];
  private maxPages: number;
  private baseUrl: string;
  private customRules: any[] = [];
  private scanLevel: string;

  constructor(private options: ScanOptions) {
    this.maxPages = options.crawlLimit;
    this.scanLevel = options.scanLevel;
    this.customRules = options.customRules || [];
    
    try {
      const parsedUrl = new URL(options.url);
      this.baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;
      this.queue.push(options.url);
    } catch (err) {
      throw new Error('Invalid URL format');
    }
  }

  async run(): Promise<ScanResult> {
    const vulnerabilities: InsertVulnerability[] = [];
    
    // Make sure we at least scan the initial URL even if maxPages is 0
    if (this.maxPages <= 0) {
      this.maxPages = 1;
    }
    
    console.log(`Starting scan for ${this.options.url} with scan level: ${this.scanLevel}, crawl limit: ${this.maxPages}`);
    
    // Process queue
    while (this.queue.length > 0 && this.visited.size < this.maxPages) {
      const currentUrl = this.queue.shift()!;
      
      if (this.visited.has(currentUrl)) {
        continue;
      }
      
      console.log(`Scanning URL: ${currentUrl} (${this.visited.size + 1}/${this.maxPages})`);
      this.visited.add(currentUrl);
      
      try {
        // Fetch the page with a timeout
        const response = await axios.get(currentUrl, {
          headers: {
            'User-Agent': 'AppSafeguard Security Scanner',
          },
          maxRedirects: 5,
          timeout: 15000, // Increased timeout to 15 seconds
          validateStatus: (status) => status < 500, // Accept any status < 500 to allow analyzing 4xx responses too
        });
        
        // Check for vulnerabilities in the response
        const detected = await vulnerabilityDetector.detectVulnerabilities(currentUrl, response, this.scanLevel);
        
        if (detected.length > 0) {
          console.log(`Found ${detected.length} vulnerabilities on ${currentUrl}`);
          vulnerabilities.push(...detected);
        }
        
        // If custom rules are enabled, check them too
        if (this.options.includeCustomRules && this.customRules.length > 0) {
          const customVulnerabilities = this.checkCustomRules(currentUrl, response.data);
          if (customVulnerabilities.length > 0) {
            console.log(`Found ${customVulnerabilities.length} custom rule violations on ${currentUrl}`);
            vulnerabilities.push(...customVulnerabilities);
          }
        }
        
        // If we're doing a standard or detailed scan, extract and follow links
        if (this.scanLevel !== 'quick') {
          this.extractLinks(currentUrl, response.data);
        }
      } catch (error: any) {
        const errorMessage = error && typeof error.message === 'string' 
          ? error.message 
          : 'Unknown error occurred';
          
        console.error(`Error scanning ${currentUrl}:`, errorMessage);
        
        // Add an "access error" vulnerability for URLs that couldn't be accessed
        vulnerabilities.push({
          scanId: 0, // This will be set later
          name: 'URL Access Error',
          description: `Could not access ${currentUrl}: ${errorMessage}`,
          url: currentUrl,
          severity: 'low',
          category: 'Accessibility',
          details: { error: errorMessage },
          status: 'pending',
        });
      }
    }
    
    // Calculate summary statistics
    const summary = this.calculateSummary(vulnerabilities);
    
    console.log(`Scan completed. Visited ${this.visited.size} URLs. Found ${vulnerabilities.length} vulnerabilities.`);
    console.log(`Summary: High: ${summary.highSeverity}, Medium: ${summary.mediumSeverity}, Low: ${summary.lowSeverity}`);
    
    return {
      scannedUrls: Array.from(this.visited),
      vulnerabilities,
      summary,
    };
  }
  
  private extractLinks(baseUrl: string, html: string) {
    try {
      const $ = cheerio.load(html);
      const links = $('a[href]')
        .map((_, el) => $(el).attr('href'))
        .get();
      
      for (const link of links) {
        try {
          // Skip empty links, javascript: links, mailto: links, etc.
          if (!link || link.startsWith('javascript:') || link.startsWith('mailto:') || link.startsWith('#')) {
            continue;
          }
          
          // Convert relative URLs to absolute
          let absoluteUrl;
          try {
            absoluteUrl = new URL(link, baseUrl).href;
          } catch {
            continue; // Skip invalid URLs
          }
          
          // Only follow links to the same domain
          if (absoluteUrl.startsWith(this.baseUrl) && !this.visited.has(absoluteUrl) && !this.queue.includes(absoluteUrl)) {
            this.queue.push(absoluteUrl);
          }
        } catch (error) {
          console.error(`Error processing link ${link}:`, error);
        }
      }
    } catch (error) {
      console.error(`Error extracting links from ${baseUrl}:`, error);
    }
  }
  
  private checkCustomRules(url: string, content: string): InsertVulnerability[] {
    const vulnerabilities: InsertVulnerability[] = [];
    
    for (const rule of this.customRules) {
      try {
        if (rule.enabled) {
          const regex = new RegExp(rule.pattern, 'i');
          if (regex.test(content)) {
            vulnerabilities.push({
              scanId: 0, // This will be set later
              name: rule.name,
              description: rule.description,
              url,
              severity: rule.severity,
              category: rule.category,
              details: { rule: rule.id, matched: true },
              status: 'pending',
            });
          }
        }
      } catch (error) {
        console.error(`Error applying custom rule ${rule.name}:`, error);
      }
    }
    
    return vulnerabilities;
  }
  
  private calculateSummary(vulnerabilities: InsertVulnerability[]) {
    const highSeverity = vulnerabilities.filter(v => v.severity === 'high').length;
    const mediumSeverity = vulnerabilities.filter(v => v.severity === 'medium').length;
    const lowSeverity = vulnerabilities.filter(v => v.severity === 'low').length;
    const totalVulnerabilities = vulnerabilities.length;
    
    // Calculate security score (0-100)
    // Formula: 100 - (highSeverity * 10 + mediumSeverity * 5 + lowSeverity * 2)
    // Minimum score is 0
    let securityScore = 100 - (highSeverity * 10 + mediumSeverity * 5 + lowSeverity * 2);
    securityScore = Math.max(0, securityScore);
    securityScore = Math.min(100, securityScore);
    
    return {
      totalVulnerabilities,
      highSeverity,
      mediumSeverity,
      lowSeverity,
      securityScore,
    };
  }
}

export async function runScan(options: ScanOptions): Promise<ScanResult> {
  const scanner = new Scanner(options);
  return await scanner.run();
}
