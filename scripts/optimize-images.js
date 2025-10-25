#!/usr/bin/env node
/**
 * Image Optimization Script for Kennel Management System
 * Optimizes images for web performance, generates multiple formats, and creates responsive versions
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  inputDir: 'public/images',
  outputDir: 'public/images/optimized',
  reportDir: 'reports/image-optimization',
  formats: ['webp', 'avif', 'jpeg'],
  sizes: [
    { name: 'thumbnail', width: 150, height: 150 },
    { name: 'small', width: 300, height: 300 },
    { name: 'medium', width: 600, height: 600 },
    { name: 'large', width: 1200, height: 1200 }
  ],
  quality: {
    webp: 80,
    avif: 70,
    jpeg: 85
  },
  maxFileSize: 500 * 1024, // 500KB
  supportedFormats: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff']
};

class ImageOptimizer {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      processedImages: [],
      totalSavings: 0,
      recommendations: []
    };
  }

  async optimize() {
    console.log('🖼️  Starting image optimization...');
    
    try {
      await this.checkDependencies();
      await this.createOutputDirectories();
      await this.processImages();
      await this.generateResponsiveImages();
      await this.analyzeResults();
      await this.generateRecommendations();
      await this.generateReport();
      
      console.log('✅ Image optimization complete!');
      console.log(`📊 Report generated: ${CONFIG.reportDir}/image-optimization-${Date.now()}.json`);
    } catch (error) {
      console.error('❌ Image optimization failed:', error.message);
      process.exit(1);
    }
  }

  async checkDependencies() {
    console.log('🔍 Checking dependencies...');
    
    try {
      execSync('which convert', { stdio: 'pipe' });
      console.log('✅ ImageMagick found');
    } catch (error) {
      console.log('⚠️  ImageMagick not found. Installing...');
      try {
        execSync('brew install imagemagick', { stdio: 'inherit' });
      } catch (installError) {
        throw new Error('Could not install ImageMagick. Please install manually.');
      }
    }
  }

  async createOutputDirectories() {
    console.log('📁 Creating output directories...');
    
    const directories = [
      CONFIG.outputDir,
      CONFIG.reportDir,
      path.join(CONFIG.outputDir, 'webp'),
      path.join(CONFIG.outputDir, 'avif'),
      path.join(CONFIG.outputDir, 'jpeg'),
      path.join(CONFIG.outputDir, 'responsive')
    ];
    
    directories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async processImages() {
    console.log('🔄 Processing images...');
    
    const images = this.getImageFiles();
    console.log(`📊 Found ${images.length} images to process`);
    
    for (const image of images) {
      try {
        const result = await this.optimizeImage(image);
        this.results.processedImages.push(result);
        console.log(`✅ Processed: ${image.name}`);
      } catch (error) {
        console.log(`❌ Failed to process: ${image.name} - ${error.message}`);
      }
    }
  }

  getImageFiles() {
    if (!fs.existsSync(CONFIG.inputDir)) {
      console.log('⚠️  Input directory not found');
      return [];
    }
    
    const files = fs.readdirSync(CONFIG.inputDir)
      .filter(file => CONFIG.supportedFormats.includes(path.extname(file).toLowerCase()))
      .map(file => ({
        name: file,
        path: path.join(CONFIG.inputDir, file),
        size: fs.statSync(path.join(CONFIG.inputDir, file)).size
      }));
    
    return files;
  }

  async optimizeImage(image) {
    const result = {
      original: {
        name: image.name,
        path: image.path,
        size: image.size
      },
      optimized: {},
      savings: 0
    };
    
    // Generate optimized versions for each format
    for (const format of CONFIG.formats) {
      const outputPath = path.join(CONFIG.outputDir, format, this.getOptimizedFileName(image.name, format));
      
      try {
        await this.convertImage(image.path, outputPath, format);
        const optimizedSize = fs.statSync(outputPath).size;
        
        result.optimized[format] = {
          path: outputPath,
          size: optimizedSize
        };
        
        // Calculate savings
        const savings = image.size - optimizedSize;
        result.savings = Math.max(result.savings, savings);
        
      } catch (error) {
        console.log(`⚠️  Failed to convert ${image.name} to ${format}: ${error.message}`);
      }
    }
    
    return result;
  }

  async convertImage(inputPath, outputPath, format) {
    const quality = CONFIG.quality[format] || 80;
    
    let command;
    switch (format) {
      case 'webp':
        command = `convert "${inputPath}" -quality ${quality} -define webp:lossless=false "${outputPath}"`;
        break;
      case 'avif':
        command = `convert "${inputPath}" -quality ${quality} "${outputPath}"`;
        break;
      case 'jpeg':
        command = `convert "${inputPath}" -quality ${quality} -strip "${outputPath}"`;
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
    
    execSync(command, { stdio: 'pipe' });
  }

  getOptimizedFileName(originalName, format) {
    const ext = path.extname(originalName);
    const name = path.basename(originalName, ext);
    return `${name}.${format}`;
  }

  async generateResponsiveImages() {
    console.log('📱 Generating responsive images...');
    
    for (const image of this.results.processedImages) {
      for (const size of CONFIG.sizes) {
        await this.generateResponsiveVersion(image, size);
      }
    }
  }

  async generateResponsiveVersion(image, size) {
    const responsiveDir = path.join(CONFIG.outputDir, 'responsive', size.name);
    if (!fs.existsSync(responsiveDir)) {
      fs.mkdirSync(responsiveDir, { recursive: true });
    }
    
    for (const format of CONFIG.formats) {
      if (image.optimized[format]) {
        const outputPath = path.join(responsiveDir, this.getResponsiveFileName(image.original.name, format, size));
        
        try {
          await this.resizeImage(image.optimized[format].path, outputPath, size);
        } catch (error) {
          console.log(`⚠️  Failed to resize ${image.original.name} to ${size.name}: ${error.message}`);
        }
      }
    }
  }

  async resizeImage(inputPath, outputPath, size) {
    const command = `convert "${inputPath}" -resize ${size.width}x${size.height}^ -gravity center -extent ${size.width}x${size.height} "${outputPath}"`;
    execSync(command, { stdio: 'pipe' });
  }

  getResponsiveFileName(originalName, format, size) {
    const ext = path.extname(originalName);
    const name = path.basename(originalName, ext);
    return `${name}-${size.name}.${format}`;
  }

  async analyzeResults() {
    console.log('📊 Analyzing optimization results...');
    
    let totalOriginalSize = 0;
    let totalOptimizedSize = 0;
    
    this.results.processedImages.forEach(image => {
      totalOriginalSize += image.original.size;
      
      // Find the best optimized version
      const bestOptimized = Object.values(image.optimized)
        .reduce((best, current) => current.size < best.size ? current : best);
      
      totalOptimizedSize += bestOptimized.size;
    });
    
    this.results.totalSavings = totalOriginalSize - totalOptimizedSize;
    
    console.log(`📊 Total original size: ${this.formatBytes(totalOriginalSize)}`);
    console.log(`📊 Total optimized size: ${this.formatBytes(totalOptimizedSize)}`);
    console.log(`📊 Total savings: ${this.formatBytes(this.results.totalSavings)}`);
  }

  async generateRecommendations() {
    console.log('💡 Generating optimization recommendations...');
    
    const recommendations = [];
    
    // Large file recommendations
    const largeFiles = this.results.processedImages.filter(image => 
      image.original.size > CONFIG.maxFileSize
    );
    
    if (largeFiles.length > 0) {
      recommendations.push({
        type: 'large_files',
        priority: 'high',
        message: `Found ${largeFiles.length} large image files`,
        suggestions: [
          'Consider using WebP format for better compression',
          'Implement lazy loading for large images',
          'Use responsive images with srcset',
          'Consider using a CDN for image delivery'
        ]
      });
    }
    
    // Format recommendations
    const webpSavings = this.calculateFormatSavings('webp');
    const avifSavings = this.calculateFormatSavings('avif');
    
    if (webpSavings > 0) {
      recommendations.push({
        type: 'format_optimization',
        priority: 'medium',
        message: 'WebP format provides significant savings',
        suggestions: [
          'Implement WebP format with JPEG fallback',
          'Use picture element for format selection',
          'Consider progressive JPEG for better loading experience'
        ]
      });
    }
    
    if (avifSavings > 0) {
      recommendations.push({
        type: 'format_optimization',
        priority: 'medium',
        message: 'AVIF format provides excellent compression',
        suggestions: [
          'Implement AVIF format with WebP and JPEG fallbacks',
          'Use modern image formats for supported browsers',
          'Consider format detection based on browser support'
        ]
      });
    }
    
    // Responsive image recommendations
    recommendations.push({
      type: 'responsive_images',
      priority: 'medium',
      message: 'Responsive images generated successfully',
      suggestions: [
        'Implement srcset for responsive images',
        'Use sizes attribute for proper image selection',
        'Consider using picture element for art direction',
        'Implement lazy loading for below-the-fold images'
      ]
    });
    
    this.results.recommendations = recommendations;
  }

  calculateFormatSavings(format) {
    let totalSavings = 0;
    
    this.results.processedImages.forEach(image => {
      if (image.optimized[format]) {
        const savings = image.original.size - image.optimized[format].size;
        totalSavings += savings;
      }
    });
    
    return totalSavings;
  }

  async generateReport() {
    console.log('📊 Generating optimization report...');
    
    // Ensure report directory exists
    if (!fs.existsSync(CONFIG.reportDir)) {
      fs.mkdirSync(CONFIG.reportDir, { recursive: true });
    }

    const reportPath = path.join(CONFIG.reportDir, `image-optimization-${Date.now()}.json`);
    
    // Generate JSON report
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    
    // Generate HTML report
    const htmlReport = this.generateHTMLReport();
    const htmlPath = path.join(CONFIG.reportDir, `image-optimization-${Date.now()}.html`);
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
    <title>Image Optimization Report</title>
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
        .savings { color: #28a745; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Image Optimization Report</h1>
        <p>Generated: ${this.results.timestamp}</p>
    </div>

    <div class="section">
        <h2>Optimization Summary</h2>
        <div class="metric">
            <strong>Images Processed:</strong> ${this.results.processedImages.length}
        </div>
        <div class="metric">
            <strong>Total Savings:</strong> <span class="savings">${this.formatBytes(this.results.totalSavings)}</span>
        </div>
        <div class="metric">
            <strong>Average Savings:</strong> <span class="savings">${this.formatBytes(this.results.totalSavings / this.results.processedImages.length)}</span>
        </div>
    </div>

    <div class="section">
        <h2>Top 10 Optimized Images</h2>
        <table>
            <thead>
                <tr>
                    <th>Image Name</th>
                    <th>Original Size</th>
                    <th>Best Optimized Size</th>
                    <th>Savings</th>
                    <th>Savings %</th>
                </tr>
            </thead>
            <tbody>
                ${this.results.processedImages
                  .sort((a, b) => b.savings - a.savings)
                  .slice(0, 10)
                  .map(image => {
                    const bestOptimized = Object.values(image.optimized)
                      .reduce((best, current) => current.size < best.size ? current : best);
                    const savingsPercent = ((image.savings / image.original.size) * 100).toFixed(1);
                    return `
                      <tr>
                        <td>${image.original.name}</td>
                        <td>${this.formatBytes(image.original.size)}</td>
                        <td>${this.formatBytes(bestOptimized.size)}</td>
                        <td class="savings">${this.formatBytes(image.savings)}</td>
                        <td class="savings">${savingsPercent}%</td>
                      </tr>
                    `;
                  }).join('')}
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

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Run the optimizer
if (require.main === module) {
  const optimizer = new ImageOptimizer();
  optimizer.optimize().catch(console.error);
}

module.exports = ImageOptimizer;
