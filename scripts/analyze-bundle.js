#!/usr/bin/env node
/**
 * Bundle Analysis Script for Kennel Management System
 * Analyzes bundle size, identifies optimization opportunities, and generates reports
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  outputDir: '.next/analyze',
  reportDir: 'reports/bundle-analysis',
  thresholds: {
    maxBundleSize: 500 * 1024, // 500KB
    maxChunkSize: 200 * 1024, // 200KB
    maxAssetSize: 100 * 1024, // 100KB
  },
  excludePatterns: [
    'node_modules',
    '.git',
    '.next',
    'coverage',
    'dist',
    'build'
  ]
};

class BundleAnalyzer {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      bundleSize: 0,
      chunks: [],
      assets: [],
      duplicates: [],
      recommendations: []
    };
  }

  async analyze() {
    console.log('🔍 Starting bundle analysis...');
    
    try {
      await this.buildApplication();
      await this.analyzeBundleSize();
      await this.analyzeChunks();
      await this.analyzeAssets();
      await this.findDuplicates();
      await this.generateRecommendations();
      await this.generateReport();
      
      console.log('✅ Bundle analysis complete!');
      console.log(`📊 Report generated: ${CONFIG.reportDir}/bundle-analysis-${Date.now()}.json`);
    } catch (error) {
      console.error('❌ Bundle analysis failed:', error.message);
      process.exit(1);
    }
  }

  async buildApplication() {
    console.log('🏗️  Building application...');
    
    try {
      execSync('pnpm build', { stdio: 'inherit' });
      console.log('✅ Application built successfully');
    } catch (error) {
      throw new Error(`Build failed: ${error.message}`);
    }
  }

  async analyzeBundleSize() {
    console.log('📦 Analyzing bundle size...');
    
    const buildDir = '.next/static';
    if (!fs.existsSync(buildDir)) {
      throw new Error('Build directory not found');
    }

    const files = this.getFilesRecursively(buildDir);
    let totalSize = 0;

    for (const file of files) {
      const stats = fs.statSync(file);
      totalSize += stats.size;
    }

    this.results.bundleSize = totalSize;
    console.log(`📊 Total bundle size: ${this.formatBytes(totalSize)}`);
  }

  async analyzeChunks() {
    console.log('🧩 Analyzing chunks...');
    
    const chunksDir = '.next/static/chunks';
    if (!fs.existsSync(chunksDir)) {
      console.log('⚠️  No chunks directory found');
      return;
    }

    const chunkFiles = fs.readdirSync(chunksDir)
      .filter(file => file.endsWith('.js'))
      .map(file => ({
        name: file,
        path: path.join(chunksDir, file),
        size: fs.statSync(path.join(chunksDir, file)).size
      }))
      .sort((a, b) => b.size - a.size);

    this.results.chunks = chunkFiles;
    
    // Identify large chunks
    const largeChunks = chunkFiles.filter(chunk => 
      chunk.size > CONFIG.thresholds.maxChunkSize
    );

    if (largeChunks.length > 0) {
      console.log(`⚠️  Found ${largeChunks.length} large chunks:`);
      largeChunks.forEach(chunk => {
        console.log(`  - ${chunk.name}: ${this.formatBytes(chunk.size)}`);
      });
    }
  }

  async analyzeAssets() {
    console.log('🖼️  Analyzing assets...');
    
    const assetsDir = '.next/static';
    if (!fs.existsSync(assetsDir)) {
      console.log('⚠️  No assets directory found');
      return;
    }

    const assetFiles = this.getFilesRecursively(assetsDir)
      .filter(file => !file.includes('/chunks/'))
      .map(file => ({
        name: path.basename(file),
        path: file,
        size: fs.statSync(file).size,
        type: path.extname(file)
      }))
      .sort((a, b) => b.size - a.size);

    this.results.assets = assetFiles;
    
    // Identify large assets
    const largeAssets = assetFiles.filter(asset => 
      asset.size > CONFIG.thresholds.maxAssetSize
    );

    if (largeAssets.length > 0) {
      console.log(`⚠️  Found ${largeAssets.length} large assets:`);
      largeAssets.forEach(asset => {
        console.log(`  - ${asset.name}: ${this.formatBytes(asset.size)}`);
      });
    }
  }

  async findDuplicates() {
    console.log('🔍 Finding duplicate dependencies...');
    
    try {
      // Use webpack-bundle-analyzer to find duplicates
      const analyzerOutput = execSync('npx webpack-bundle-analyzer .next/static --mode static --report', 
        { encoding: 'utf8', stdio: 'pipe' }
      );
      
      // Parse analyzer output for duplicates
      const duplicates = this.parseDuplicates(analyzerOutput);
      this.results.duplicates = duplicates;
      
      if (duplicates.length > 0) {
        console.log(`⚠️  Found ${duplicates.length} duplicate dependencies:`);
        duplicates.forEach(dup => {
          console.log(`  - ${dup.name}: ${dup.instances} instances`);
        });
      }
    } catch (error) {
      console.log('⚠️  Could not analyze duplicates:', error.message);
    }
  }

  async generateRecommendations() {
    console.log('💡 Generating optimization recommendations...');
    
    const recommendations = [];

    // Bundle size recommendations
    if (this.results.bundleSize > CONFIG.thresholds.maxBundleSize) {
      recommendations.push({
        type: 'bundle_size',
        priority: 'high',
        message: `Bundle size (${this.formatBytes(this.results.bundleSize)}) exceeds threshold (${this.formatBytes(CONFIG.thresholds.maxBundleSize)})`,
        suggestions: [
          'Implement code splitting',
          'Remove unused dependencies',
          'Optimize images and assets',
          'Use dynamic imports for large components'
        ]
      });
    }

    // Large chunks recommendations
    const largeChunks = this.results.chunks.filter(chunk => 
      chunk.size > CONFIG.thresholds.maxChunkSize
    );
    
    if (largeChunks.length > 0) {
      recommendations.push({
        type: 'large_chunks',
        priority: 'medium',
        message: `Found ${largeChunks.length} large chunks`,
        suggestions: [
          'Split large chunks into smaller ones',
          'Use dynamic imports for route-based code splitting',
          'Implement lazy loading for non-critical components'
        ]
      });
    }

    // Large assets recommendations
    const largeAssets = this.results.assets.filter(asset => 
      asset.size > CONFIG.thresholds.maxAssetSize
    );
    
    if (largeAssets.length > 0) {
      recommendations.push({
        type: 'large_assets',
        priority: 'medium',
        message: `Found ${largeAssets.length} large assets`,
        suggestions: [
          'Optimize images (WebP, compression)',
          'Use CDN for static assets',
          'Implement image lazy loading',
          'Compress assets with gzip/brotli'
        ]
      });
    }

    // Duplicate dependencies recommendations
    if (this.results.duplicates.length > 0) {
      recommendations.push({
        type: 'duplicates',
        priority: 'low',
        message: `Found ${this.results.duplicates.length} duplicate dependencies`,
        suggestions: [
          'Update package.json to use consistent versions',
          'Use npm/yarn dedupe to remove duplicates',
          'Consider using a monorepo structure',
          'Audit dependencies for unused packages'
        ]
      });
    }

    this.results.recommendations = recommendations;
  }

  async generateReport() {
    console.log('📊 Generating analysis report...');
    
    // Ensure report directory exists
    if (!fs.existsSync(CONFIG.reportDir)) {
      fs.mkdirSync(CONFIG.reportDir, { recursive: true });
    }

    const reportPath = path.join(CONFIG.reportDir, `bundle-analysis-${Date.now()}.json`);
    
    // Generate JSON report
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    
    // Generate HTML report
    const htmlReport = this.generateHTMLReport();
    const htmlPath = path.join(CONFIG.reportDir, `bundle-analysis-${Date.now()}.html`);
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
    <title>Bundle Analysis Report</title>
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
    </style>
</head>
<body>
    <div class="header">
        <h1>Bundle Analysis Report</h1>
        <p>Generated: ${this.results.timestamp}</p>
    </div>

    <div class="section">
        <h2>Bundle Metrics</h2>
        <div class="metric">
            <strong>Total Bundle Size:</strong> ${this.formatBytes(this.results.bundleSize)}
        </div>
        <div class="metric">
            <strong>Number of Chunks:</strong> ${this.results.chunks.length}
        </div>
        <div class="metric">
            <strong>Number of Assets:</strong> ${this.results.assets.length}
        </div>
    </div>

    <div class="section">
        <h2>Top 10 Largest Chunks</h2>
        <table>
            <thead>
                <tr>
                    <th>Chunk Name</th>
                    <th>Size</th>
                </tr>
            </thead>
            <tbody>
                ${this.results.chunks.slice(0, 10).map(chunk => `
                    <tr>
                        <td>${chunk.name}</td>
                        <td>${this.formatBytes(chunk.size)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>Top 10 Largest Assets</h2>
        <table>
            <thead>
                <tr>
                    <th>Asset Name</th>
                    <th>Type</th>
                    <th>Size</th>
                </tr>
            </thead>
            <tbody>
                ${this.results.assets.slice(0, 10).map(asset => `
                    <tr>
                        <td>${asset.name}</td>
                        <td>${asset.type}</td>
                        <td>${this.formatBytes(asset.size)}</td>
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

  getFilesRecursively(dir) {
    const files = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...this.getFilesRecursively(fullPath));
      } else {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  parseDuplicates(analyzerOutput) {
    // Simple duplicate detection based on file patterns
    const duplicates = [];
    const fileCounts = {};
    
    const files = this.getFilesRecursively('.next/static');
    files.forEach(file => {
      const basename = path.basename(file);
      fileCounts[basename] = (fileCounts[basename] || 0) + 1;
    });
    
    Object.entries(fileCounts).forEach(([name, count]) => {
      if (count > 1) {
        duplicates.push({ name, instances: count });
      }
    });
    
    return duplicates;
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Run the analyzer
if (require.main === module) {
  const analyzer = new BundleAnalyzer();
  analyzer.analyze().catch(console.error);
}

module.exports = BundleAnalyzer;
