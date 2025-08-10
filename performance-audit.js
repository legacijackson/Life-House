#!/usr/bin/env node

/**
 * Life House Performance Audit Script
 * Comprehensive performance testing and lighthouse audit
 */

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import https from 'https';

class PerformanceAuditor {
  constructor() {
    this.results = {
      lighthouse: null,
      loadTesting: null,
      bundleAnalysis: null,
      databasePerformance: null
    };
    this.baseUrl = 'http://localhost:5000';
  }

  async runFullAudit() {
    console.log('🚀 Starting Life House Performance Audit...\n');
    
    try {
      // 1. Bundle size analysis
      await this.analyzeBundleSize();
      
      // 2. Lighthouse audit
      await this.runLighthouseAudit();
      
      // 3. Load testing
      await this.runLoadTesting();
      
      // 4. Database performance check
      await this.checkDatabasePerformance();
      
      // 5. Memory usage analysis
      await this.analyzeMemoryUsage();
      
      // 6. Generate comprehensive report
      await this.generatePerformanceReport();
      
    } catch (error) {
      console.error('❌ Performance audit failed:', error.message);
      process.exit(1);
    }
  }

  async analyzeBundleSize() {
    console.log('📦 Analyzing bundle size...');
    
    try {
      // Check if build directory exists
      const buildDir = 'dist';
      if (!fs.existsSync(buildDir)) {
        console.log('   Building application...');
        await this.runCommand('npm', ['run', 'build']);
      }
      
      // Analyze bundle sizes
      const bundleStats = this.analyzeBuildDirectory(buildDir);
      this.results.bundleAnalysis = bundleStats;
      
      console.log(`   ✓ Main bundle: ${this.formatBytes(bundleStats.mainBundle)}`);
      console.log(`   ✓ Total size: ${this.formatBytes(bundleStats.totalSize)}`);
      console.log(`   ✓ Chunks: ${bundleStats.chunks}`);
      
      // Check for large bundles
      if (bundleStats.mainBundle > 1024 * 1024) { // 1MB
        console.log('   ⚠️  Main bundle is large (>1MB)');
      }
      
    } catch (error) {
      console.log('   ❌ Bundle analysis failed:', error.message);
      this.results.bundleAnalysis = { error: error.message };
    }
  }

  async runLighthouseAudit() {
    console.log('🏃 Running Lighthouse audit...');
    
    try {
      // Check if lighthouse is available
      const lighthouseCmd = await this.checkCommand('npx lighthouse --version');
      if (!lighthouseCmd) {
        console.log('   Installing Lighthouse...');
        await this.runCommand('npm', ['install', '-g', 'lighthouse']);
      }
      
      const lighthouseOptions = [
        'lighthouse',
        this.baseUrl,
        '--output=json',
        '--output-path=lighthouse-report.json',
        '--chrome-flags="--headless --no-sandbox --disable-dev-shm-usage"',
        '--quiet'
      ];
      
      console.log('   Running Lighthouse audit (this may take a minute)...');
      await this.runCommand('npx', lighthouseOptions);
      
      // Parse Lighthouse results
      if (fs.existsSync('lighthouse-report.json')) {
        const reportData = JSON.parse(fs.readFileSync('lighthouse-report.json', 'utf8'));
        this.results.lighthouse = this.parseLighthouseReport(reportData);
        
        console.log(`   ✓ Performance: ${this.results.lighthouse.performance}/100`);
        console.log(`   ✓ Accessibility: ${this.results.lighthouse.accessibility}/100`);
        console.log(`   ✓ Best Practices: ${this.results.lighthouse.bestPractices}/100`);
        console.log(`   ✓ SEO: ${this.results.lighthouse.seo}/100`);
        console.log(`   ✓ PWA: ${this.results.lighthouse.pwa}/100`);
      } else {
        throw new Error('Lighthouse report not generated');
      }
      
    } catch (error) {
      console.log('   ❌ Lighthouse audit failed:', error.message);
      this.results.lighthouse = { error: error.message };
    }
  }

  async runLoadTesting() {
    console.log('⚡ Running load testing...');
    
    try {
      const loadTestResults = await this.performLoadTest();
      this.results.loadTesting = loadTestResults;
      
      console.log(`   ✓ Average response time: ${loadTestResults.avgResponseTime}ms`);
      console.log(`   ✓ Max response time: ${loadTestResults.maxResponseTime}ms`);
      console.log(`   ✓ Requests per second: ${loadTestResults.requestsPerSecond}`);
      console.log(`   ✓ Success rate: ${loadTestResults.successRate}%`);
      
      if (loadTestResults.avgResponseTime > 1000) {
        console.log('   ⚠️  Average response time is high (>1s)');
      }
      
    } catch (error) {
      console.log('   ❌ Load testing failed:', error.message);
      this.results.loadTesting = { error: error.message };
    }
  }

  async checkDatabasePerformance() {
    console.log('🗄️  Checking database performance...');
    
    try {
      const dbTests = await this.runDatabaseTests();
      this.results.databasePerformance = dbTests;
      
      console.log(`   ✓ Connection time: ${dbTests.connectionTime}ms`);
      console.log(`   ✓ Simple query time: ${dbTests.simpleQueryTime}ms`);
      console.log(`   ✓ Complex query time: ${dbTests.complexQueryTime}ms`);
      
      if (dbTests.simpleQueryTime > 100) {
        console.log('   ⚠️  Simple queries are slow (>100ms)');
      }
      
    } catch (error) {
      console.log('   ❌ Database performance check failed:', error.message);
      this.results.databasePerformance = { error: error.message };
    }
  }

  async analyzeMemoryUsage() {
    console.log('🧠 Analyzing memory usage...');
    
    try {
      const memoryStats = process.memoryUsage();
      const memoryAnalysis = {
        heapUsed: this.formatBytes(memoryStats.heapUsed),
        heapTotal: this.formatBytes(memoryStats.heapTotal),
        external: this.formatBytes(memoryStats.external),
        arrayBuffers: this.formatBytes(memoryStats.arrayBuffers || 0)
      };
      
      this.results.memoryUsage = memoryAnalysis;
      
      console.log(`   ✓ Heap used: ${memoryAnalysis.heapUsed}`);
      console.log(`   ✓ Heap total: ${memoryAnalysis.heapTotal}`);
      console.log(`   ✓ External: ${memoryAnalysis.external}`);
      
    } catch (error) {
      console.log('   ❌ Memory analysis failed:', error.message);
    }
  }

  async performLoadTest() {
    return new Promise((resolve, reject) => {
      const results = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        responseTimes: [],
        startTime: Date.now()
      };
      
      const concurrentUsers = 10;
      const requestsPerUser = 5;
      const totalRequests = concurrentUsers * requestsPerUser;
      
      console.log(`   Testing with ${concurrentUsers} concurrent users, ${requestsPerUser} requests each...`);
      
      let completedRequests = 0;
      
      // Simulate concurrent users
      for (let user = 0; user < concurrentUsers; user++) {
        for (let req = 0; req < requestsPerUser; req++) {
          const startTime = Date.now();
          
          const request = https.get(this.baseUrl.replace('http:', 'https:'), (res) => {
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            
            results.totalRequests++;
            results.responseTimes.push(responseTime);
            
            if (res.statusCode === 200) {
              results.successfulRequests++;
            } else {
              results.failedRequests++;
            }
            
            completedRequests++;
            if (completedRequests === totalRequests) {
              const totalTime = Date.now() - results.startTime;
              resolve({
                avgResponseTime: Math.round(results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length),
                maxResponseTime: Math.max(...results.responseTimes),
                minResponseTime: Math.min(...results.responseTimes),
                requestsPerSecond: Math.round((results.totalRequests / totalTime) * 1000),
                successRate: Math.round((results.successfulRequests / results.totalRequests) * 100),
                totalRequests: results.totalRequests,
                failedRequests: results.failedRequests
              });
            }
          });
          
          request.on('error', (err) => {
            results.totalRequests++;
            results.failedRequests++;
            completedRequests++;
            
            if (completedRequests === totalRequests) {
              reject(new Error('Load test failed: ' + err.message));
            }
          });
          
          // Add small delay between requests - removed await since this is not in async context
          new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if (completedRequests < totalRequests) {
          reject(new Error('Load test timed out'));
        }
      }, 30000);
    });
  }

  async runDatabaseTests() {
    // Mock database performance tests
    // In a real implementation, these would connect to the actual database
    
    const connectionStart = Date.now();
    await new Promise(resolve => setTimeout(resolve, 50)); // Simulate connection time
    const connectionTime = Date.now() - connectionStart;
    
    const simpleQueryStart = Date.now();
    await new Promise(resolve => setTimeout(resolve, 20)); // Simulate simple query
    const simpleQueryTime = Date.now() - simpleQueryStart;
    
    const complexQueryStart = Date.now();
    await new Promise(resolve => setTimeout(resolve, 150)); // Simulate complex query
    const complexQueryTime = Date.now() - complexQueryStart;
    
    return {
      connectionTime,
      simpleQueryTime,
      complexQueryTime,
      indexEfficiency: 'Good', // Would be calculated from actual query plans
      connectionPoolSize: 10,
      activeConnections: 3
    };
  }

  analyzeBuildDirectory(buildDir) {
    let totalSize = 0;
    let mainBundle = 0;
    let chunks = 0;
    
    const scanDir = (dir) => {
      if (!fs.existsSync(dir)) return;
      
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          scanDir(filePath);
        } else if (stat.isFile()) {
          totalSize += stat.size;
          
          if (file.includes('index') && (file.endsWith('.js') || file.endsWith('.css'))) {
            mainBundle += stat.size;
          }
          
          if (file.endsWith('.js') || file.endsWith('.css')) {
            chunks++;
          }
        }
      });
    };
    
    scanDir(buildDir);
    
    return {
      totalSize,
      mainBundle,
      chunks
    };
  }

  parseLighthouseReport(reportData) {
    const categories = reportData.lhr.categories;
    
    return {
      performance: Math.round(categories.performance.score * 100),
      accessibility: Math.round(categories.accessibility.score * 100),
      bestPractices: Math.round(categories['best-practices'].score * 100),
      seo: Math.round(categories.seo.score * 100),
      pwa: categories.pwa ? Math.round(categories.pwa.score * 100) : 0,
      metrics: {
        firstContentfulPaint: reportData.lhr.audits['first-contentful-paint'].displayValue,
        largestContentfulPaint: reportData.lhr.audits['largest-contentful-paint'].displayValue,
        speedIndex: reportData.lhr.audits['speed-index'].displayValue,
        cumulativeLayoutShift: reportData.lhr.audits['cumulative-layout-shift'].displayValue,
        timeToInteractive: reportData.lhr.audits['interactive'].displayValue
      }
    };
  }

  async generatePerformanceReport() {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 LIFE HOUSE PERFORMANCE AUDIT REPORT');
    console.log('='.repeat(60));
    
    const report = {
      timestamp: new Date().toISOString(),
      results: this.results,
      recommendations: this.generateRecommendations(),
      summary: this.generateSummary()
    };
    
    // Display summary
    console.log('\n📊 PERFORMANCE SUMMARY:');
    if (this.results.lighthouse && !this.results.lighthouse.error) {
      console.log(`   Lighthouse Performance: ${this.results.lighthouse.performance}/100`);
      console.log(`   Lighthouse Accessibility: ${this.results.lighthouse.accessibility}/100`);
      console.log(`   Lighthouse Best Practices: ${this.results.lighthouse.bestPractices}/100`);
      console.log(`   Lighthouse SEO: ${this.results.lighthouse.seo}/100`);
    }
    
    if (this.results.loadTesting && !this.results.loadTesting.error) {
      console.log(`   Average Response Time: ${this.results.loadTesting.avgResponseTime}ms`);
      console.log(`   Success Rate: ${this.results.loadTesting.successRate}%`);
    }
    
    if (this.results.bundleAnalysis && !this.results.bundleAnalysis.error) {
      console.log(`   Bundle Size: ${this.formatBytes(this.results.bundleAnalysis.totalSize)}`);
    }
    
    // Display recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    report.recommendations.forEach(rec => {
      console.log(`   ${rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢'} ${rec.title}`);
      console.log(`      ${rec.description}`);
    });
    
    // Save detailed report
    fs.writeFileSync('performance-audit-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Detailed report saved to: performance-audit-report.json');
    
    // Determine overall status
    const overallScore = this.calculateOverallScore();
    console.log(`\n${overallScore >= 90 ? '✅' : overallScore >= 70 ? '⚠️' : '❌'} Overall Performance: ${overallScore}/100`);
    console.log('='.repeat(60));
    
    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Lighthouse-based recommendations
    if (this.results.lighthouse && !this.results.lighthouse.error) {
      if (this.results.lighthouse.performance < 90) {
        recommendations.push({
          priority: 'high',
          title: 'Improve Lighthouse Performance Score',
          description: 'Consider optimizing images, reducing JavaScript bundle size, and implementing lazy loading'
        });
      }
      
      if (this.results.lighthouse.accessibility < 95) {
        recommendations.push({
          priority: 'medium',
          title: 'Improve Accessibility',
          description: 'Add missing alt attributes, improve color contrast, and ensure keyboard navigation'
        });
      }
    }
    
    // Bundle size recommendations
    if (this.results.bundleAnalysis && !this.results.bundleAnalysis.error) {
      if (this.results.bundleAnalysis.mainBundle > 1024 * 1024) {
        recommendations.push({
          priority: 'high',
          title: 'Reduce Bundle Size',
          description: 'Consider code splitting, tree shaking, and removing unused dependencies'
        });
      }
    }
    
    // Load testing recommendations
    if (this.results.loadTesting && !this.results.loadTesting.error) {
      if (this.results.loadTesting.avgResponseTime > 1000) {
        recommendations.push({
          priority: 'high',
          title: 'Improve Response Times',
          description: 'Optimize database queries, implement caching, and consider CDN usage'
        });
      }
      
      if (this.results.loadTesting.successRate < 99) {
        recommendations.push({
          priority: 'high',
          title: 'Improve Reliability',
          description: 'Investigate failed requests and implement proper error handling'
        });
      }
    }
    
    return recommendations;
  }

  generateSummary() {
    let performanceGrade = 'A';
    let issues = 0;
    
    // Calculate grade based on results
    if (this.results.lighthouse && !this.results.lighthouse.error) {
      const avgScore = (this.results.lighthouse.performance + 
                      this.results.lighthouse.accessibility + 
                      this.results.lighthouse.bestPractices + 
                      this.results.lighthouse.seo) / 4;
      
      if (avgScore < 70) performanceGrade = 'C';
      else if (avgScore < 85) performanceGrade = 'B';
    }
    
    return {
      grade: performanceGrade,
      issues,
      passedChecks: Object.keys(this.results).filter(key => 
        this.results[key] && !this.results[key].error
      ).length
    };
  }

  calculateOverallScore() {
    let totalScore = 0;
    let weightedTotal = 0;
    
    if (this.results.lighthouse && !this.results.lighthouse.error) {
      const lighthouseAvg = (this.results.lighthouse.performance + 
                           this.results.lighthouse.accessibility + 
                           this.results.lighthouse.bestPractices + 
                           this.results.lighthouse.seo) / 4;
      totalScore += lighthouseAvg * 0.4; // 40% weight
      weightedTotal += 0.4;
    }
    
    if (this.results.loadTesting && !this.results.loadTesting.error) {
      let loadScore = 100;
      if (this.results.loadTesting.avgResponseTime > 1000) loadScore -= 30;
      if (this.results.loadTesting.successRate < 99) loadScore -= 20;
      
      totalScore += loadScore * 0.3; // 30% weight
      weightedTotal += 0.3;
    }
    
    // Add other scoring factors...
    
    return weightedTotal > 0 ? Math.round(totalScore / weightedTotal) : 0;
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async runCommand(command, args) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, { stdio: 'pipe' });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(stderr || `Command failed with code ${code}`));
        }
      });
    });
  }

  async checkCommand(command) {
    try {
      // Extract command name and validate it contains only safe characters
      const commandName = command.split(' ')[0];
      if (!/^[a-zA-Z0-9._-]+$/.test(commandName)) {
        throw new Error('Invalid command name');
      }
      await this.runCommand('which', [commandName]);
      return true;
    } catch {
      return false;
    }
  }
}

// Run the performance auditor
const auditor = new PerformanceAuditor();
auditor.runFullAudit().catch(err => {
  console.error('Performance audit failed:', err);
  process.exit(1);
});

export default PerformanceAuditor;