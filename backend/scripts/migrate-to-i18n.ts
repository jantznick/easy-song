import 'dotenv/config';
import path from 'path';
import { migrateDirectory } from './utils/data-migration';

/**
 * Migration script to convert old data format to new i18n format
 * 
 * Usage:
 *   npx ts-node scripts/migrate-to-i18n.ts
 *   npx ts-node scripts/migrate-to-i18n.ts --no-backup
 *   npx ts-node scripts/migrate-to-i18n.ts --songs-only
 *   npx ts-node scripts/migrate-to-i18n.ts --study-only
 */

const SONGS_DIR = path.resolve(__dirname, '../data/songs');
const STUDY_DIR = path.resolve(__dirname, '../data/study');

async function main() {
  const noBackup = process.argv.includes('--no-backup');
  const songsOnly = process.argv.includes('--songs-only');
  const studyOnly = process.argv.includes('--study-only');

  console.log('=== Data Migration to i18n Format ===\n');
  console.log('This script converts:');
  console.log('  - "spanish" → "es"');
  console.log('  - "english" → "en"');
  console.log('  - section.title (string) → section.title (i18n object)');
  console.log('  - section.sectionExplanation (string) → section.sectionExplanation (i18n object)\n');

  if (noBackup) {
    console.warn('⚠️  WARNING: Backups disabled. Original files will be overwritten!\n');
  } else {
    console.log('💾 Backups will be created (.backup files)\n');
  }

  try {
    if (!studyOnly) {
      await migrateDirectory(SONGS_DIR, !noBackup);
    }

    if (!songsOnly) {
      await migrateDirectory(STUDY_DIR, !noBackup);
    }

    console.log('\n✅ All migrations complete!');
    console.log('\nNote: Section explanations are currently only in English.');
    console.log('      You may want to translate them using a translation API or AI.');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

main();

