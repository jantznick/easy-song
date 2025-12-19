import os from 'os';

interface SystemResources {
  freeMemoryMB: number;
  totalMemoryMB: number;
  memoryUsagePercent: number;
  cpuCount: number;
  loadAverage: number[];
  canRunLLM: boolean;
}

/**
 * Check system resources to determine if it's safe to run LLM processing
 */
export async function checkSystemResources(
  minFreeMemoryMB: number = 2048, // Default: 2GB free
  maxMemoryUsagePercent: number = 80 // Default: 80% max usage
): Promise<SystemResources> {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsagePercent = (usedMemory / totalMemory) * 100;
  
  const resources: SystemResources = {
    freeMemoryMB: Math.round(freeMemory / 1024 / 1024),
    totalMemoryMB: Math.round(totalMemory / 1024 / 1024),
    memoryUsagePercent: Math.round(memoryUsagePercent * 100) / 100,
    cpuCount: os.cpus().length,
    loadAverage: os.loadavg(),
    canRunLLM: freeMemory >= minFreeMemoryMB * 1024 * 1024 && memoryUsagePercent < maxMemoryUsagePercent,
  };
  
  return resources;
}

/**
 * Format system resources for display
 */
export function formatSystemResources(resources: SystemResources): string {
  return `
System Resources:
  Memory: ${resources.freeMemoryMB}MB free / ${resources.totalMemoryMB}MB total (${resources.memoryUsagePercent}% used)
  CPUs: ${resources.cpuCount}
  Load Average: ${resources.loadAverage.map(l => l.toFixed(2)).join(', ')}
  Can Run LLM: ${resources.canRunLLM ? '✅ Yes' : '❌ No'}
  `;
}

/**
 * Wait until system resources are available
 */
export async function waitForResources(
  checkIntervalMs: number = 60000, // Check every minute
  maxWaitTimeMs: number = 3600000, // Max wait 1 hour
  minFreeMemoryMB: number = 2048,
  maxMemoryUsagePercent: number = 80
): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitTimeMs) {
    const resources = await checkSystemResources(minFreeMemoryMB, maxMemoryUsagePercent);
    
    if (resources.canRunLLM) {
      console.log('✅ System resources available');
      return true;
    }
    
    console.log(`⏳ Waiting for resources... (${resources.memoryUsagePercent}% memory used, ${resources.freeMemoryMB}MB free)`);
    await new Promise(resolve => setTimeout(resolve, checkIntervalMs));
  }
  
  console.log('❌ Timeout waiting for system resources');
  return false;
}

