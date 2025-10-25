#!/usr/bin/env node
/**
 * Database Query Optimization Script for Kennel Management System
 * Analyzes database queries, identifies slow queries, and provides optimization recommendations
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  reportDir: 'reports/database-optimization',
  slowQueryThreshold: 100, // milliseconds
  maxQueryTime: 1000, // milliseconds
  sampleSize: 1000, // number of queries to analyze
};

class DatabaseOptimizer {
  constructor() {
    this.prisma = new PrismaClient();
    this.results = {
      timestamp: new Date().toISOString(),
      slowQueries: [],
      recommendations: [],
      indexes: [],
      statistics: {
        totalQueries: 0,
        slowQueries: 0,
        averageQueryTime: 0,
        maxQueryTime: 0
      }
    };
  }

  async analyze() {
    console.log('🔍 Starting database optimization analysis...');
    
    try {
      await this.analyzeSlowQueries();
      await this.analyzeIndexes();
      await this.analyzeQueryPatterns();
      await this.generateRecommendations();
      await this.generateReport();
      
      console.log('✅ Database optimization analysis complete!');
      console.log(`📊 Report generated: ${CONFIG.reportDir}/database-optimization-${Date.now()}.json`);
    } catch (error) {
      console.error('❌ Database optimization analysis failed:', error.message);
      process.exit(1);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async analyzeSlowQueries() {
    console.log('🐌 Analyzing slow queries...');
    
    try {
      // Enable query logging
      await this.prisma.$executeRaw`SET log_statement = 'all'`;
      await this.prisma.$executeRaw`SET log_min_duration_statement = ${CONFIG.slowQueryThreshold}`;
      
      // Get slow queries from PostgreSQL logs
      const slowQueries = await this.getSlowQueries();
      this.results.slowQueries = slowQueries;
      
      console.log(`📊 Found ${slowQueries.length} slow queries`);
    } catch (error) {
      console.log('⚠️  Could not analyze slow queries:', error.message);
    }
  }

  async getSlowQueries() {
    try {
      // Query PostgreSQL system tables for slow queries
      const result = await this.prisma.$queryRaw`
        SELECT 
          query,
          mean_time,
          calls,
          total_time,
          rows,
          100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
        FROM pg_stat_statements 
        WHERE mean_time > ${CONFIG.slowQueryThreshold}
        ORDER BY mean_time DESC
        LIMIT 50
      `;
      
      return result.map(row => ({
        query: row.query,
        meanTime: parseFloat(row.mean_time),
        calls: parseInt(row.calls),
        totalTime: parseFloat(row.total_time),
        rows: parseInt(row.rows),
        hitPercent: parseFloat(row.hit_percent)
      }));
    } catch (error) {
      console.log('⚠️  Could not query pg_stat_statements:', error.message);
      return [];
    }
  }

  async analyzeIndexes() {
    console.log('📊 Analyzing database indexes...');
    
    try {
      // Get index usage statistics
      const indexStats = await this.prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan,
          idx_tup_read,
          idx_tup_fetch
        FROM pg_stat_user_indexes
        ORDER BY idx_scan DESC
      `;
      
      // Get unused indexes
      const unusedIndexes = await this.prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan
        FROM pg_stat_user_indexes
        WHERE idx_scan = 0
        ORDER BY tablename, indexname
      `;
      
      // Get duplicate indexes
      const duplicateIndexes = await this.prisma.$queryRaw`
        SELECT 
          t1.schemaname,
          t1.tablename,
          t1.indexname as index1,
          t2.indexname as index2,
          t1.idx_scan as scans1,
          t2.idx_scan as scans2
        FROM pg_stat_user_indexes t1
        JOIN pg_stat_user_indexes t2 ON t1.tablename = t2.tablename
        WHERE t1.indexname < t2.indexname
        AND t1.idx_scan < t2.idx_scan
      `;
      
      this.results.indexes = {
        usage: indexStats,
        unused: unusedIndexes,
        duplicates: duplicateIndexes
      };
      
      console.log(`📊 Found ${unusedIndexes.length} unused indexes`);
      console.log(`📊 Found ${duplicateIndexes.length} duplicate indexes`);
    } catch (error) {
      console.log('⚠️  Could not analyze indexes:', error.message);
    }
  }

  async analyzeQueryPatterns() {
    console.log('🔍 Analyzing query patterns...');
    
    try {
      // Analyze common query patterns
      const queryPatterns = await this.prisma.$queryRaw`
        SELECT 
          query,
          calls,
          total_time,
          mean_time,
          stddev_time
        FROM pg_stat_statements
        ORDER BY calls DESC
        LIMIT 20
      `;
      
      // Analyze table access patterns
      const tableStats = await this.prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          seq_scan,
          seq_tup_read,
          idx_scan,
          idx_tup_fetch,
          n_tup_ins,
          n_tup_upd,
          n_tup_del
        FROM pg_stat_user_tables
        ORDER BY seq_scan DESC
      `;
      
      this.results.queryPatterns = {
        common: queryPatterns,
        tableAccess: tableStats
      };
      
      console.log(`📊 Analyzed ${queryPatterns.length} query patterns`);
    } catch (error) {
      console.log('⚠️  Could not analyze query patterns:', error.message);
    }
  }

  async generateRecommendations() {
    console.log('💡 Generating optimization recommendations...');
    
    const recommendations = [];

    // Slow query recommendations
    if (this.results.slowQueries.length > 0) {
      recommendations.push({
        type: 'slow_queries',
        priority: 'high',
        message: `Found ${this.results.slowQueries.length} slow queries`,
        suggestions: [
          'Add appropriate indexes for slow queries',
          'Optimize query structure and joins',
          'Consider query result caching',
          'Use database query hints where appropriate'
        ]
      });
    }

    // Unused index recommendations
    if (this.results.indexes.unused.length > 0) {
      recommendations.push({
        type: 'unused_indexes',
        priority: 'medium',
        message: `Found ${this.results.indexes.unused.length} unused indexes`,
        suggestions: [
          'Remove unused indexes to improve write performance',
          'Monitor index usage before removal',
          'Consider partial indexes for specific use cases'
        ]
      });
    }

    // Duplicate index recommendations
    if (this.results.indexes.duplicates.length > 0) {
      recommendations.push({
        type: 'duplicate_indexes',
        priority: 'medium',
        message: `Found ${this.results.indexes.duplicates.length} duplicate indexes`,
        suggestions: [
          'Remove duplicate indexes',
          'Consolidate similar indexes',
          'Use composite indexes where appropriate'
        ]
      });
    }

    // Table scan recommendations
    const tablesWithSeqScans = this.results.queryPatterns?.tableAccess?.filter(
      table => table.seq_scan > 0
    ) || [];
    
    if (tablesWithSeqScans.length > 0) {
      recommendations.push({
        type: 'sequential_scans',
        priority: 'high',
        message: `Found ${tablesWithSeqScans.length} tables with sequential scans`,
        suggestions: [
          'Add indexes for frequently queried columns',
          'Optimize WHERE clauses',
          'Consider partitioning for large tables',
          'Use covering indexes for common queries'
        ]
      });
    }

    // General performance recommendations
    recommendations.push({
      type: 'general_performance',
      priority: 'low',
      message: 'General database performance optimizations',
      suggestions: [
        'Enable query result caching',
        'Optimize database configuration',
        'Monitor and tune database parameters',
        'Implement connection pooling',
        'Use prepared statements',
        'Consider read replicas for read-heavy workloads'
      ]
    });

    this.results.recommendations = recommendations;
  }

  async generateReport() {
    console.log('📊 Generating optimization report...');
    
    // Ensure report directory exists
    if (!fs.existsSync(CONFIG.reportDir)) {
      fs.mkdirSync(CONFIG.reportDir, { recursive: true });
    }

    const reportPath = path.join(CONFIG.reportDir, `database-optimization-${Date.now()}.json`);
    
    // Generate JSON report
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    
    // Generate HTML report
    const htmlReport = this.generateHTMLReport();
    const htmlPath = path.join(CONFIG.reportDir, `database-optimization-${Date.now()}.html`);
    fs.writeFileSync(htmlPath, htmlReport);
    
    console.log(`📊 HTML report generated: ${htmlPath}`);
  }

  generateHTMLReport() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Database Optimization Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; }
        .section { margin: 20px 0; }
        .metric { display: inline-block; margin: 10px; padding: 10px; background: #e8f4fd; border-radius: 4px; }
        .recommendation { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 10px 0; border-radius: 4px; }
        .high { border-left: 4px solid #dc3545; }
        .medium { border-left: 4px solid #ffc107; }
        .low { border-left: 4px solid #28a745; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .query { font-family: monospace; background: #f8f9fa; padding: 5px; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Database Optimization Report</h1>
        <p>Generated: ${this.results.timestamp}</p>
    </div>

    <div class="section">
        <h2>Database Statistics</h2>
        <div class="metric">
            <strong>Total Queries:</strong> ${this.results.statistics.totalQueries}
        </div>
        <div class="metric">
            <strong>Slow Queries:</strong> ${this.results.slowQueries.length}
        </div>
        <div class="metric">
            <strong>Unused Indexes:</strong> ${this.results.indexes.unused?.length || 0}
        </div>
        <div class="metric">
            <strong>Duplicate Indexes:</strong> ${this.results.indexes.duplicates?.length || 0}
        </div>
    </div>

    <div class="section">
        <h2>Slow Queries</h2>
        <table>
            <thead>
                <tr>
                    <th>Query</th>
                    <th>Mean Time (ms)</th>
                    <th>Calls</th>
                    <th>Total Time (ms)</th>
                    <th>Hit %</th>
                </tr>
            </thead>
            <tbody>
                ${this.results.slowQueries.slice(0, 10).map(query => `
                    <tr>
                        <td><div class="query">${this.truncateQuery(query.query)}</div></td>
                        <td>${query.meanTime.toFixed(2)}</td>
                        <td>${query.calls}</td>
                        <td>${query.totalTime.toFixed(2)}</td>
                        <td>${query.hitPercent.toFixed(2)}%</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>Unused Indexes</h2>
        <table>
            <thead>
                <tr>
                    <th>Schema</th>
                    <th>Table</th>
                    <th>Index</th>
                    <th>Scans</th>
                </tr>
            </thead>
            <tbody>
                ${(this.results.indexes.unused || []).slice(0, 10).map(index => `
                    <tr>
                        <td>${index.schemaname}</td>
                        <td>${index.tablename}</td>
                        <td>${index.indexname}</td>
                        <td>${index.idx_scan}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>Optimization Recommendations</h2>
        ${this.results.recommendations.map(rec => `
            <div class="recommendation ${rec.priority}">
                <h3>${rec.message}</h3>
                <ul>
                    ${rec.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
                </ul>
            </div>
        `).join('')}
    </div>
</body>
</html>`;
  }

  truncateQuery(query, maxLength = 100) {
    if (query.length <= maxLength) return query;
    return query.substring(0, maxLength) + '...';
  }
}

// Run the optimizer
if (require.main === module) {
  const optimizer = new DatabaseOptimizer();
  optimizer.analyze().catch(console.error);
}

module.exports = DatabaseOptimizer;
