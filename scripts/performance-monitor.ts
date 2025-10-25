#!/usr/bin/env tsx

/**
 * Performance Monitoring Script for Kennel Management System
 * Monitors and optimizes application performance
 */

import { performanceOptimizer } from '../src/lib/performance/optimization';
import { writeFileSync } from 'fs';
import { join } from 'path';

async function main() {
  console.log('🔍 Starting performance monitoring...\n');
  
  try {
    // Bundle optimization
    console.log('📦 Analyzing bundle optimization...');
    const bundleResult = await performanceOptimizer.optimizeBundle();
    console.log(`Bundle size: ${(bundleResult.bundleSize / 1024).toFixed(2)} KB`);
    console.log(`Large dependencies: ${bundleResult.largeDependencies.length}`);
    console.log(`Code splitting opportunities: ${bundleResult.codeSplittingOpportunities.length}`);
    console.log(`Recommendations: ${bundleResult.recommendations.length}\n`);
    
    // Query optimization
    console.log('🗄️ Analyzing database query optimization...');
    const queryResult = await performanceOptimizer.optimizeQueries();
    console.log(`Slow queries: ${queryResult.slowQueries.length}`);
    console.log(`Missing indexes: ${queryResult.missingIndexes.length}`);
    console.log(`Query patterns: ${queryResult.queryPatterns.length}`);
    console.log(`Recommendations: ${queryResult.recommendations.length}\n`);
    
    // Image optimization
    console.log('🖼️ Analyzing image optimization...');
    const imageResult = await performanceOptimizer.optimizeImages();
    console.log(`Image usage: ${imageResult.imageUsage.length}`);
    console.log(`Unoptimized images: ${imageResult.unoptimizedImages.length}`);
    console.log(`Responsive opportunities: ${imageResult.responsiveOpportunities.length}`);
    console.log(`Recommendations: ${imageResult.recommendations.length}\n`);
    
    // Lazy loading
    console.log('⚡ Implementing lazy loading...');
    const lazyResult = await performanceOptimizer.implementLazyLoading();
    console.log(`Lazy loading opportunities: ${lazyResult.opportunities.length}`);
    console.log(`Image lazy loading: ${lazyResult.imageLazyLoading.implemented ? '✅' : '❌'}`);
    console.log(`Component lazy loading: ${lazyResult.componentLazyLoading.implemented ? '✅' : '❌'}`);
    console.log(`Route lazy loading: ${lazyResult.routeLazyLoading.implemented ? '✅' : '❌'}\n`);
    
    // Performance monitoring
    console.log('📊 Collecting performance metrics...');
    const performanceResult = await performanceOptimizer.monitorPerformance();
    console.log(`Performance metrics: ${performanceResult.metrics.length}`);
    console.log(`Performance trends: ${performanceResult.trends.length}`);
    console.log(`Bottlenecks: ${performanceResult.bottlenecks.length}`);
    console.log(`Recommendations: ${performanceResult.recommendations.length}\n`);
    
    // Generate performance report
    const report = generatePerformanceReport({
      bundle: bundleResult,
      query: queryResult,
      image: imageResult,
      lazy: lazyResult,
      performance: performanceResult
    });
    
    // Save report to file
    const reportPath = join(process.cwd(), 'docs', 'performance-report.json');
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Performance report saved to: ${reportPath}`);
    
    // Display summary
    console.log('\n📋 Performance Summary:');
    console.log(`Total recommendations: ${report.summary.totalRecommendations}`);
    console.log(`High priority: ${report.summary.highPriority}`);
    console.log(`Medium priority: ${report.summary.mediumPriority}`);
    console.log(`Low priority: ${report.summary.lowPriority}`);
    
    console.log('\n✅ Performance monitoring completed successfully!');
    
  } catch (error) {
    console.error('❌ Performance monitoring failed:', error);
    process.exit(1);
  }
}

function generatePerformanceReport(results: {
  bundle: any;
  query: any;
  image: any;
  lazy: any;
  performance: any;
}) {
  const allRecommendations = [
    ...results.bundle.recommendations,
    ...results.query.recommendations,
    ...results.image.recommendations,
    ...results.performance.recommendations
  ];
  
  const highPriority = allRecommendations.filter(r => r.priority === 'high').length;
  const mediumPriority = allRecommendations.filter(r => r.priority === 'medium').length;
  const lowPriority = allRecommendations.filter(r => r.priority === 'low').length;
  
  return {
    timestamp: new Date().toISOString(),
    summary: {
      totalRecommendations: allRecommendations.length,
      highPriority,
      mediumPriority,
      lowPriority
    },
    bundle: {
      size: results.bundle.bundleSize,
      largeDependencies: results.bundle.largeDependencies,
      codeSplittingOpportunities: results.bundle.codeSplittingOpportunities,
      recommendations: results.bundle.recommendations
    },
    query: {
      slowQueries: results.query.slowQueries,
      missingIndexes: results.query.missingIndexes,
      queryPatterns: results.query.queryPatterns,
      recommendations: results.query.recommendations
    },
    image: {
      imageUsage: results.image.imageUsage,
      unoptimizedImages: results.image.unoptimizedImages,
      responsiveOpportunities: results.image.responsiveOpportunities,
      recommendations: results.image.recommendations
    },
    lazy: {
      opportunities: results.lazy.opportunities,
      imageLazyLoading: results.lazy.imageLazyLoading,
      componentLazyLoading: results.lazy.componentLazyLoading,
      routeLazyLoading: results.lazy.routeLazyLoading
    },
    performance: {
      metrics: results.performance.metrics,
      trends: results.performance.trends,
      bottlenecks: results.performance.bottlenecks,
      recommendations: results.performance.recommendations
    }
  };
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}
