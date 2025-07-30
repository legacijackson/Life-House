#!/usr/bin/env node

/**
 * Life House Security Scanner
 * Basic security audit script for the application
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { spawn } from 'child_process';

class SecurityScanner {
  constructor() {
    this.vulnerabilities = [];
    this.warnings = [];
    this.info = [];
  }

  // OWASP Top 10 Security Checks
  async runSecurityAudit() {
    console.log('🔒 Starting Life House Security Audit...\n');
    
    // 1. Check for sensitive data exposure
    this.checkSensitiveDataExposure();
    
    // 2. Check authentication implementation
    this.checkAuthenticationSecurity();
    
    // 3. Check for injection vulnerabilities
    this.checkInjectionVulnerabilities();
    
    // 4. Check access controls
    this.checkAccessControls();
    
    // 5. Check configuration security
    this.checkSecurityConfiguration();
    
    // 6. Check dependencies
    await this.checkDependencyVulnerabilities();
    
    // 7. Check HTTPS and transport security
    this.checkTransportSecurity();
    
    // 8. Check logging and monitoring
    this.checkLoggingAndMonitoring();
    
    this.generateReport();
  }

  checkSensitiveDataExposure() {
    console.log('📋 Checking for sensitive data exposure...');
    
    const sensitivePatterns = [
      /password\s*[=:]\s*['"]\w+['"]/gi,
      /api[_-]?key\s*[=:]\s*['"]\w+['"]/gi,
      /secret\s*[=:]\s*['"]\w+['"]/gi,
      /token\s*[=:]\s*['"]\w+['"]/gi,
      /database[_-]?url\s*[=:]\s*['"]\w+['"]/gi
    ];

    const sourceFiles = this.getSourceFiles();
    
    sourceFiles.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        sensitivePatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            this.vulnerabilities.push({
              severity: 'HIGH',
              type: 'Sensitive Data Exposure',
              file: file,
              issue: `Potential hardcoded sensitive data: ${matches[0]}`,
              recommendation: 'Move sensitive data to environment variables'
            });
          }
        });
      } catch (err) {
        // Skip files that can't be read
      }
    });

    // Check for proper environment variable usage
    const envFiles = ['.env', '.env.local', '.env.example'];
    envFiles.forEach(envFile => {
      if (fs.existsSync(envFile)) {
        const content = fs.readFileSync(envFile, 'utf8');
        if (content.includes('password=') || content.includes('secret=actual')) {
          this.vulnerabilities.push({
            severity: 'HIGH',
            type: 'Sensitive Data Exposure',
            file: envFile,
            issue: 'Environment file contains sensitive data',
            recommendation: 'Use placeholder values in example files'
          });
        }
      }
    });

    this.info.push('✓ Sensitive data exposure check completed');
  }

  checkAuthenticationSecurity() {
    console.log('🔐 Checking authentication security...');
    
    // Check for secure session configuration
    const serverFiles = this.getFilesByPattern('server/**/*.ts');
    
    serverFiles.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for secure session settings
        if (content.includes('express-session')) {
          if (!content.includes('secure: true') && !content.includes('NODE_ENV')) {
            this.warnings.push({
              severity: 'MEDIUM',
              type: 'Authentication Security',
              file: file,
              issue: 'Session not configured for HTTPS in production',
              recommendation: 'Set secure: true for production sessions'
            });
          }
          
          if (!content.includes('httpOnly: true')) {
            this.vulnerabilities.push({
              severity: 'HIGH',
              type: 'Authentication Security',
              file: file,
              issue: 'Session cookies not set to httpOnly',
              recommendation: 'Set httpOnly: true to prevent XSS attacks'
            });
          }
        }
        
      } catch (err) {
        // Skip files that can't be read
      }
    });

    this.info.push('✓ Authentication security check completed');
  }

  checkInjectionVulnerabilities() {
    console.log('💉 Checking for injection vulnerabilities...');
    
    const sourceFiles = this.getSourceFiles();
    
    sourceFiles.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for SQL injection patterns
        const sqlPatterns = [
          /query\s*\(\s*[`'"]\s*SELECT.*\$\{/gi,
          /query\s*\(\s*[`'"]\s*INSERT.*\$\{/gi,
          /query\s*\(\s*[`'"]\s*UPDATE.*\$\{/gi,
          /query\s*\(\s*[`'"]\s*DELETE.*\$\{/gi
        ];
        
        sqlPatterns.forEach(pattern => {
          if (pattern.test(content)) {
            this.vulnerabilities.push({
              severity: 'HIGH',
              type: 'SQL Injection',
              file: file,
              issue: 'Potential SQL injection vulnerability detected',
              recommendation: 'Use parameterized queries or ORM'
            });
          }
        });
        
        // Check for XSS vulnerabilities
        if (content.includes('innerHTML') && !content.includes('sanitize')) {
          this.warnings.push({
            severity: 'MEDIUM',
            type: 'XSS Vulnerability',
            file: file,
            issue: 'Potential XSS vulnerability with innerHTML',
            recommendation: 'Sanitize user input before rendering'
          });
        }
        
      } catch (err) {
        // Skip files that can't be read
      }
    });

    this.info.push('✓ Injection vulnerability check completed');
  }

  checkAccessControls() {
    console.log('🛡️ Checking access controls...');
    
    // Check RBAC implementation
    const rbacFile = 'client/src/lib/rbac.ts';
    if (fs.existsSync(rbacFile)) {
      const content = fs.readFileSync(rbacFile, 'utf8');
      
      if (!content.includes('hasPermission')) {
        this.vulnerabilities.push({
          severity: 'HIGH',
          type: 'Access Control',
          file: rbacFile,
          issue: 'Missing permission checking function',
          recommendation: 'Implement proper permission checking'
        });
      } else {
        this.info.push('✓ RBAC system implemented');
      }
    } else {
      this.vulnerabilities.push({
        severity: 'HIGH',
        type: 'Access Control',
        file: 'N/A',
        issue: 'No RBAC implementation found',
        recommendation: 'Implement role-based access control'
      });
    }
    
    // Check API route protection
    const routeFiles = this.getFilesByPattern('server/**/*route*.ts');
    routeFiles.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        if (!content.includes('middleware') && !content.includes('auth')) {
          this.warnings.push({
            severity: 'MEDIUM',
            type: 'Access Control',
            file: file,
            issue: 'API routes may not be properly protected',
            recommendation: 'Add authentication middleware to protected routes'
          });
        }
      } catch (err) {
        // Skip files that can't be read
      }
    });

    this.info.push('✓ Access control check completed');
  }

  checkSecurityConfiguration() {
    console.log('⚙️ Checking security configuration...');
    
    // Check for security headers
    const serverFiles = this.getFilesByPattern('server/**/*.ts');
    let hasSecurityHeaders = false;
    
    serverFiles.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        if (content.includes('helmet') || content.includes('X-Frame-Options')) {
          hasSecurityHeaders = true;
        }
      } catch (err) {
        // Skip files that can't be read
      }
    });
    
    if (!hasSecurityHeaders) {
      this.warnings.push({
        severity: 'MEDIUM',
        type: 'Security Configuration',
        file: 'server',
        issue: 'Security headers not configured',
        recommendation: 'Add helmet middleware for security headers'
      });
    }
    
    // Check CORS configuration
    let hasCorsConfig = false;
    serverFiles.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('cors')) {
          hasCorsConfig = true;
        }
      } catch (err) {
        // Skip files that can't be read
      }
    });
    
    if (!hasCorsConfig) {
      this.warnings.push({
        severity: 'MEDIUM',
        type: 'Security Configuration',
        file: 'server',
        issue: 'CORS not configured',
        recommendation: 'Configure CORS properly for production'
      });
    }

    this.info.push('✓ Security configuration check completed');
  }

  async checkDependencyVulnerabilities() {
    console.log('📦 Checking dependency vulnerabilities...');
    
    try {
      // Check if package.json exists
      if (fs.existsSync('package.json')) {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        // List of known vulnerable packages (simplified check)
        const knownVulnerable = [
          'lodash@4.17.20',
          'axios@0.21.0',
          'yargs-parser@18.1.2'
        ];
        
        Object.keys(dependencies).forEach(dep => {
          const version = dependencies[dep];
          const depVersion = `${dep}@${version}`;
          
          if (knownVulnerable.includes(depVersion)) {
            this.vulnerabilities.push({
              severity: 'HIGH',
              type: 'Vulnerable Dependency',
              file: 'package.json',
              issue: `Vulnerable dependency: ${depVersion}`,
              recommendation: 'Update to latest secure version'
            });
          }
        });
        
        this.info.push(`✓ Checked ${Object.keys(dependencies).length} dependencies`);
      }
    } catch (err) {
      this.warnings.push({
        severity: 'LOW',
        type: 'Dependency Check',
        file: 'package.json',
        issue: 'Could not parse package.json',
        recommendation: 'Verify package.json format'
      });
    }

    this.info.push('✓ Dependency vulnerability check completed');
  }

  checkTransportSecurity() {
    console.log('🔒 Checking transport security...');
    
    // Check for HTTPS configuration
    const serverFiles = this.getSourceFiles();
    let hasHttpsConfig = false;
    
    serverFiles.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        if (content.includes('https.createServer') || content.includes('SSL_CERT')) {
          hasHttpsConfig = true;
        }
        
        // Check for insecure protocols
        if (content.includes('http://') && !content.includes('localhost')) {
          this.warnings.push({
            severity: 'MEDIUM',
            type: 'Transport Security',
            file: file,
            issue: 'Insecure HTTP protocol used',
            recommendation: 'Use HTTPS for all external communications'
          });
        }
      } catch (err) {
        // Skip files that can't be read
      }
    });
    
    if (!hasHttpsConfig) {
      this.warnings.push({
        severity: 'MEDIUM',
        type: 'Transport Security',
        file: 'server',
        issue: 'HTTPS not configured',
        recommendation: 'Configure HTTPS for production deployment'
      });
    }

    this.info.push('✓ Transport security check completed');
  }

  checkLoggingAndMonitoring() {
    console.log('📊 Checking logging and monitoring...');
    
    const sourceFiles = this.getSourceFiles();
    let hasLogging = false;
    let hasAuditLogging = false;
    
    sourceFiles.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        if (content.includes('console.log') || content.includes('logger')) {
          hasLogging = true;
        }
        
        if (content.includes('auditLog') || content.includes('audit')) {
          hasAuditLogging = true;
        }
      } catch (err) {
        // Skip files that can't be read
      }
    });
    
    if (!hasLogging) {
      this.warnings.push({
        severity: 'LOW',
        type: 'Logging',
        file: 'N/A',
        issue: 'No logging implementation found',
        recommendation: 'Implement proper logging for monitoring'
      });
    }
    
    if (!hasAuditLogging) {
      this.warnings.push({
        severity: 'MEDIUM',
        type: 'Audit Logging',
        file: 'N/A',
        issue: 'No audit logging found',
        recommendation: 'Implement audit logging for compliance'
      });
    } else {
      this.info.push('✓ Audit logging system detected');
    }

    this.info.push('✓ Logging and monitoring check completed');
  }

  getSourceFiles() {
    const files = [];
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    
    const scanDirectory = (dir) => {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir);
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          scanDirectory(fullPath);
        } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
          files.push(fullPath);
        }
      });
    };
    
    ['client', 'server', 'shared'].forEach(dir => scanDirectory(dir));
    return files;
  }

  getFilesByPattern(pattern) {
    // Simple glob-like pattern matching
    const files = this.getSourceFiles();
    return files.filter(file => {
      const normalizedPattern = pattern.replace('**/', '').replace('*', '');
      return file.includes(normalizedPattern);
    });
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('🔒 LIFE HOUSE SECURITY AUDIT REPORT');
    console.log('='.repeat(60));
    
    const total = this.vulnerabilities.length + this.warnings.length;
    const highSeverity = this.vulnerabilities.filter(v => v.severity === 'HIGH').length;
    const mediumSeverity = [...this.vulnerabilities, ...this.warnings].filter(v => v.severity === 'MEDIUM').length;
    const lowSeverity = [...this.vulnerabilities, ...this.warnings].filter(v => v.severity === 'LOW').length;
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`   Total Issues: ${total}`);
    console.log(`   🔴 High Severity: ${highSeverity}`);
    console.log(`   🟡 Medium Severity: ${mediumSeverity}`);
    console.log(`   🟢 Low Severity: ${lowSeverity}`);
    
    if (this.vulnerabilities.length > 0) {
      console.log(`\n🚨 HIGH SEVERITY VULNERABILITIES:`);
      this.vulnerabilities.forEach((vuln, index) => {
        console.log(`\n   ${index + 1}. ${vuln.type}`);
        console.log(`      File: ${vuln.file}`);
        console.log(`      Issue: ${vuln.issue}`);
        console.log(`      Fix: ${vuln.recommendation}`);
      });
    }
    
    if (this.warnings.length > 0) {
      console.log(`\n⚠️  WARNINGS:`);
      this.warnings.forEach((warning, index) => {
        console.log(`\n   ${index + 1}. ${warning.type} (${warning.severity})`);
        console.log(`      File: ${warning.file}`);
        console.log(`      Issue: ${warning.issue}`);
        console.log(`      Fix: ${warning.recommendation}`);
      });
    }
    
    console.log(`\n✅ POSITIVE FINDINGS:`);
    this.info.forEach(info => {
      console.log(`   ${info}`);
    });
    
    // Write report to file
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        total,
        highSeverity,
        mediumSeverity,
        lowSeverity
      },
      vulnerabilities: this.vulnerabilities,
      warnings: this.warnings,
      info: this.info
    };
    
    fs.writeFileSync('security-audit-report.json', JSON.stringify(reportData, null, 2));
    
    console.log(`\n📄 Detailed report saved to: security-audit-report.json`);
    console.log(`\n${highSeverity === 0 ? '✅' : '❌'} Security Status: ${highSeverity === 0 ? 'PASS' : 'FAIL'}`);
    console.log('='.repeat(60));
    
    // Exit with appropriate code
    process.exit(highSeverity > 0 ? 1 : 0);
  }
}

// Run the security scanner
const scanner = new SecurityScanner();
scanner.runSecurityAudit().catch(err => {
  console.error('Security scan failed:', err);
  process.exit(1);
});

export default SecurityScanner;