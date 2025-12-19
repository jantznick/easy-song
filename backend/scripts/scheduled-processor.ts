import 'dotenv/config';
import { exec } from 'child_process';
import { promisify } from 'util';
import { checkSystemResources, formatSystemResources, waitForResources } from './utils/system-resources';
import { getLLMConfigFromEnv } from './utils/llm-client';

const execAsync = promisify(exec);

/**
 * Scheduled processor that runs analysis on a schedule
 * Can be run via cron or as a long-running service
 * 
 * Usage:
 *   # Run once (good for cron)
 *   npx ts-node scripts/scheduled-processor.ts
 * 
 *   # Run as service (checks every hour)
 *   npx ts-node scripts/scheduled-processor.ts --daemon
 * 
 *   # Custom check interval (in minutes)
 *   npx ts-node scripts/scheduled-processor.ts --daemon --interval 30
 */
async function main() {
  const daemonMode = process.argv.includes('--daemon');
  const intervalArg = process.argv.find(arg => arg.startsWith('--interval='));
  const intervalMinutes = intervalArg ? parseInt(intervalArg.split('=')[1]) : 60;
  const maxSongsPerRun = parseInt(process.env.MAX_SONGS_PER_RUN || '3');
  const minFreeMemoryMB = parseInt(process.env.MIN_FREE_MEMORY_MB || '1024');
  const maxMemoryUsagePercent = parseInt(process.env.MAX_MEMORY_USAGE_PERCENT || '85');
  
  const llmConfig = getLLMConfigFromEnv();
  
  console.log('=== Scheduled Lyrics Processor ===');
  console.log(`Mode: ${daemonMode ? 'Daemon' : 'One-time'}`);
  console.log(`LLM Provider: ${llmConfig.provider.toUpperCase()}`);
  console.log(`Model: ${llmConfig.model}`);
  if (daemonMode) {
    console.log(`Check interval: ${intervalMinutes} minutes`);
  }
  console.log(`Max songs per run: ${maxSongsPerRun}`);
  console.log('');
  
  const processBatch = async () => {
    try {
      // Check system resources
      console.log(`[${new Date().toISOString()}] Checking system resources...`);
      const resources = await checkSystemResources(minFreeMemoryMB, maxMemoryUsagePercent);
      console.log(formatSystemResources(resources));
      
      if (!resources.canRunLLM) {
        console.log('⏳ System resources insufficient. Waiting...');
        const available = await waitForResources(60000, 1800000, minFreeMemoryMB, maxMemoryUsagePercent); // Wait up to 30 min
        if (!available) {
          console.log('❌ Could not acquire resources. Skipping this run.');
          return;
        }
      }
      
      // Run the processor with limit
      console.log(`[${new Date().toISOString()}] Processing up to ${maxSongsPerRun} song(s)...`);
      const command = `npx ts-node scripts/process-lyrics-folder.ts --skip-resource-check`;
      
      // Note: We can't easily limit the number of files processed in the current script
      // This is a placeholder - you might want to modify process-lyrics-folder.ts to accept a --limit flag
      const { stdout, stderr } = await execAsync(command, {
        cwd: process.cwd(),
        env: { ...process.env },
      });
      
      if (stdout) console.log(stdout);
      if (stderr) console.error(stderr);
      
      console.log(`[${new Date().toISOString()}] Batch processing complete.`);
      
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error in batch processing:`, error);
    }
  };
  
  if (daemonMode) {
    console.log('🔄 Starting daemon mode...');
    console.log('Press Ctrl+C to stop.\n');
    
    // Process immediately
    await processBatch();
    
    // Then schedule periodic runs
    const intervalMs = intervalMinutes * 60 * 1000;
    setInterval(async () => {
      await processBatch();
    }, intervalMs);
    
    // Keep process alive
    process.on('SIGINT', () => {
      console.log('\n👋 Shutting down daemon...');
      process.exit(0);
    });
  } else {
    // One-time run
    await processBatch();
  }
}

main();

