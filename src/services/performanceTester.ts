import { TicketPackage } from '../types';
import { VectorRecommendationEngine } from './vectorRecommendationEngine';
import { FAISSSearchService } from './faissSearchService';

export interface PerformanceBenchmark {
  engine: string;
  searchTime: number;
  resultsCount: number;
  memoryUsage?: number;
  indexBuildTime?: number;
}

export class SearchPerformanceTester {
  private packages: TicketPackage[];
  private testQueries: string[] = [
    "VIP basketball tickets in New York for 4 people",
    "Cheap baseball tickets near Boston",
    "Luxury football experience for corporate event",
    "Family-friendly hockey games this month",
    "Premium Lakers tickets with club access",
    "Budget-friendly Yankees tickets for 6 people",
    "Expensive Cowboys tickets with VIP treatment",
    "Celtics basketball games in premium seating"
  ];

  constructor(packages: TicketPackage[]) {
    this.packages = packages;
  }

  public async runBenchmarks(): Promise<{
    faissResults: PerformanceBenchmark[];
    vectorResults: PerformanceBenchmark[];
    comparison: {
      avgFAISSTime: number;
      avgVectorTime: number;
      speedImprovement: number;
      faissSuccessRate: number;
    };
  }> {
    console.log('🚀 Starting performance benchmarks...');
    
    // Initialize services
    const faissService = new FAISSSearchService(this.packages);
    const vectorService = new VectorRecommendationEngine(this.packages);
    
    // Wait for FAISS initialization
    await this.waitForInitialization(faissService);
    
    const faissResults: PerformanceBenchmark[] = [];
    const vectorResults: PerformanceBenchmark[] = [];
    
    // Run benchmarks for each test query
    for (const query of this.testQueries) {
      console.log(`Testing query: "${query}"`);
      
      // Test FAISS
      const faissResult = await this.benchmarkFAISS(faissService, query);
      faissResults.push(faissResult);
      
      // Test Vector Engine
      const vectorResult = await this.benchmarkVector(vectorService, query);
      vectorResults.push(vectorResult);
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Calculate comparison metrics
    const comparison = this.calculateComparison(faissResults, vectorResults);
    
    return {
      faissResults,
      vectorResults,
      comparison
    };
  }

  private async waitForInitialization(faissService: FAISSSearchService): Promise<void> {
    // Wait up to 5 seconds for FAISS to initialize
    const maxWait = 5000;
    const checkInterval = 100;
    let waited = 0;
    
    while (waited < maxWait) {
      const stats = faissService.getPerformanceStats();
      if (stats.isInitialized) {
        console.log('✅ FAISS service initialized');
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      waited += checkInterval;
    }
    
    console.log('⚠️ FAISS initialization timeout, proceeding with fallback');
  }

  private async benchmarkFAISS(service: FAISSSearchService, query: string): Promise<PerformanceBenchmark> {
    const startTime = performance.now();
    const memoryBefore = this.getMemoryUsage();
    
    try {
      const results = await service.findRecommendationsByQuery(query, 5);
      const endTime = performance.now();
      const memoryAfter = this.getMemoryUsage();
      
      return {
        engine: 'FAISS',
        searchTime: endTime - startTime,
        resultsCount: results.length,
        memoryUsage: memoryAfter - memoryBefore
      };
    } catch (error) {
      console.error('FAISS benchmark error:', error);
      return {
        engine: 'FAISS',
        searchTime: -1, // Indicates failure
        resultsCount: 0,
        memoryUsage: 0
      };
    }
  }

  private async benchmarkVector(service: VectorRecommendationEngine, query: string): Promise<PerformanceBenchmark> {
    const startTime = performance.now();
    const memoryBefore = this.getMemoryUsage();
    
    try {
      const results = await service.findRecommendationsByQuery(query);
      const endTime = performance.now();
      const memoryAfter = this.getMemoryUsage();
      
      return {
        engine: 'Vector',
        searchTime: endTime - startTime,
        resultsCount: results.length,
        memoryUsage: memoryAfter - memoryBefore
      };
    } catch (error) {
      console.error('Vector benchmark error:', error);
      return {
        engine: 'Vector',
        searchTime: -1,
        resultsCount: 0,
        memoryUsage: 0
      };
    }
  }

  private calculateComparison(faissResults: PerformanceBenchmark[], vectorResults: PerformanceBenchmark[]): {
    avgFAISSTime: number;
    avgVectorTime: number;
    speedImprovement: number;
    faissSuccessRate: number;
  } {
    const validFaissResults = faissResults.filter(r => r.searchTime > 0);
    const validVectorResults = vectorResults.filter(r => r.searchTime > 0);
    
    const avgFAISSTime = validFaissResults.reduce((sum, r) => sum + r.searchTime, 0) / validFaissResults.length;
    const avgVectorTime = validVectorResults.reduce((sum, r) => sum + r.searchTime, 0) / validVectorResults.length;
    
    const speedImprovement = avgVectorTime > 0 ? (avgVectorTime - avgFAISSTime) / avgVectorTime * 100 : 0;
    const faissSuccessRate = validFaissResults.length / faissResults.length * 100;
    
    return {
      avgFAISSTime: Math.round(avgFAISSTime * 100) / 100,
      avgVectorTime: Math.round(avgVectorTime * 100) / 100,
      speedImprovement: Math.round(speedImprovement * 100) / 100,
      faissSuccessRate: Math.round(faissSuccessRate * 100) / 100
    };
  }

  private getMemoryUsage(): number {
    // Browser environment - use performance.memory if available
    if (typeof window !== 'undefined' && (window.performance as any).memory) {
      return (window.performance as any).memory.usedJSHeapSize;
    }
    
    // Node.js environment
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    
    return 0; // Fallback
  }

  public generateReport(benchmarkResults: {
    faissResults: PerformanceBenchmark[];
    vectorResults: PerformanceBenchmark[];
    comparison: any;
  }): string {
    const { faissResults, vectorResults, comparison } = benchmarkResults;
    
    let report = `
# 🔍 FAISS vs Vector Search Performance Report

## 📊 Summary
- **FAISS Average Search Time**: ${comparison.avgFAISSTime}ms
- **Vector Average Search Time**: ${comparison.avgVectorTime}ms  
- **Speed Improvement**: ${comparison.speedImprovement}%
- **FAISS Success Rate**: ${comparison.faissSuccessRate}%

## 🏃‍♂️ Detailed Results

### FAISS Search Results
`;

    faissResults.forEach((result, index) => {
      const status = result.searchTime > 0 ? '✅' : '❌';
      report += `${index + 1}. ${status} ${result.searchTime}ms (${result.resultsCount} results)\n`;
    });

    report += `\n### Vector Search Results\n`;
    
    vectorResults.forEach((result, index) => {
      const status = result.searchTime > 0 ? '✅' : '❌';
      report += `${index + 1}. ${status} ${result.searchTime}ms (${result.resultsCount} results)\n`;
    });

    report += `\n## 🎯 Performance Analysis\n`;
    
    if (comparison.speedImprovement > 0) {
      report += `✅ **FAISS is ${comparison.speedImprovement}% faster** than the current vector search!\n`;
    } else if (comparison.speedImprovement < 0) {
      report += `⚠️ FAISS is ${Math.abs(comparison.speedImprovement)}% slower than vector search.\n`;
    } else {
      report += `📊 Both methods have similar performance.\n`;
    }
    
    if (comparison.faissSuccessRate < 100) {
      report += `⚠️ FAISS had ${100 - comparison.faissSuccessRate}% failure rate - may need fallback handling.\n`;
    }

    report += `\n## 🔧 Recommendations\n`;
    
    if (comparison.speedImprovement > 20 && comparison.faissSuccessRate > 90) {
      report += `🚀 **Highly recommend switching to FAISS** - significant performance improvement with good reliability.\n`;
    } else if (comparison.speedImprovement > 0 && comparison.faissSuccessRate > 95) {
      report += `✅ **Recommend FAISS** - modest performance improvement with excellent reliability.\n`;
    } else if (comparison.faissSuccessRate < 90) {
      report += `⚠️ **Stick with current vector search** - FAISS reliability issues need addressing.\n`;
    } else {
      report += `📊 **Consider gradual migration** - test FAISS in production with fallback to vector search.\n`;
    }

    return report;
  }

  // Quick test method for development
  public async quickTest(): Promise<void> {
    console.log('🧪 Running quick FAISS test...');
    
    const faissService = new FAISSSearchService(this.packages);
    await this.waitForInitialization(faissService);
    
    const testQuery = "VIP basketball tickets in New York";
    const startTime = performance.now();
    const results = await faissService.findRecommendationsByQuery(testQuery);
    const endTime = performance.now();
    
    console.log(`✅ FAISS quick test completed:`);
    console.log(`   Search time: ${(endTime - startTime).toFixed(2)}ms`);
    console.log(`   Results: ${results.length} packages found`);
    console.log(`   Service stats:`, faissService.getPerformanceStats());
    
    if (results.length > 0) {
      console.log(`   Top result: ${results[0].package.venue} - ${results[0].package.sportType} (${results[0].score}% match)`);
    }
  }
}
