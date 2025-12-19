import fs from 'fs/promises';
import path from 'path';
import { convertTitleToI18n } from './section-titles';

/**
 * Convert old data format to new i18n format
 */

interface OldLine {
  spanish?: string;
  english?: string;
  explanation?: string | null;
  start_ms: number;
  end_ms: number;
}

interface NewLine {
  es?: string;
  en?: string;
  [key: string]: string | number | null | undefined; // Allow other language codes
  explanation?: string | null;
  start_ms: number;
  end_ms: number;
}

interface OldSection {
  title: string;
  lines: OldLine[];
  sectionExplanation?: string;
}

interface NewSection {
  title: Record<string, string>;
  lines: NewLine[];
  sectionExplanation?: Record<string, string>;
}

/**
 * Convert a single line from old format to new format
 */
export function convertLine(oldLine: OldLine): NewLine {
  const newLine: NewLine = {
    start_ms: oldLine.start_ms,
    end_ms: oldLine.end_ms,
  };

  // Convert spanish -> es
  if (oldLine.spanish !== undefined) {
    newLine.es = oldLine.spanish;
  }

  // Convert english -> en
  if (oldLine.english !== undefined) {
    newLine.en = oldLine.english;
  }

  // Convert explanation to i18n object (currently English only)
  if (oldLine.explanation !== undefined && oldLine.explanation !== null) {
    newLine.explanation = {
      en: oldLine.explanation,
      // Other languages can be added via translation
    };
  } else {
    newLine.explanation = null;
  }

  return newLine;
}

/**
 * Convert a section from old format to new format
 */
export function convertSection(oldSection: OldSection): NewSection {
  const newSection: NewSection = {
    title: convertTitleToI18n(oldSection.title),
    lines: oldSection.lines.map(convertLine),
  };

  // Convert sectionExplanation if it exists
  if (oldSection.sectionExplanation) {
    // For now, just use English (can be enhanced with translation API)
    newSection.sectionExplanation = {
      "en": oldSection.sectionExplanation,
      "es": oldSection.sectionExplanation, // Should be translated
      "fr": oldSection.sectionExplanation,
      "de": oldSection.sectionExplanation,
      "zh": oldSection.sectionExplanation,
      "it": oldSection.sectionExplanation,
    };
  }

  return newSection;
}

/**
 * Convert entire song file from old format to new format
 */
export function convertSongFile(oldData: any): any {
  const newData: any = {
    videoId: oldData.videoId,
    title: oldData.title,
    artist: oldData.artist,
  };

  // Add thumbnailUrl if it exists
  if (oldData.thumbnailUrl) {
    newData.thumbnailUrl = oldData.thumbnailUrl;
  }

  // Convert sections
  if (oldData.sections) {
    newData.sections = oldData.sections.map(convertSection);
  }

  // Convert structuredSections (for study mode)
  if (oldData.structuredSections) {
    newData.structuredSections = oldData.structuredSections.map(convertSection);
  }

  // Keep metadata if it exists
  if (oldData._metadata) {
    newData._metadata = oldData._metadata;
  }

  return newData;
}

/**
 * Migrate a single file
 */
export async function migrateFile(filePath: string, backup: boolean = true): Promise<void> {
  console.log(`Migrating: ${filePath}`);

  try {
    // Read old file
    const content = await fs.readFile(filePath, 'utf-8');
    const oldData = JSON.parse(content);

    // Check if already migrated (has es/en keys instead of spanish/english)
    const isAlreadyMigrated = oldData.sections?.some((section: any) => 
      section.lines?.some((line: any) => line.es !== undefined || line.en !== undefined)
    ) || oldData.structuredSections?.some((section: any) =>
      section.lines?.some((line: any) => line.es !== undefined || line.en !== undefined)
    );

    if (isAlreadyMigrated) {
      console.log(`  ⏭️  Already migrated, skipping`);
      return;
    }

    // Create backup
    if (backup) {
      const backupPath = `${filePath}.backup`;
      await fs.copyFile(filePath, backupPath);
      console.log(`  💾 Backup created: ${backupPath}`);
    }

    // Convert
    const newData = convertSongFile(oldData);

    // Write new file
    await fs.writeFile(filePath, JSON.stringify(newData, null, 2));
    console.log(`  ✅ Migrated successfully`);
  } catch (error) {
    console.error(`  ❌ Error migrating ${filePath}:`, error);
    throw error;
  }
}

/**
 * Migrate all files in a directory
 */
export async function migrateDirectory(dirPath: string, backup: boolean = true): Promise<void> {
  console.log(`\n=== Migrating directory: ${dirPath} ===\n`);

  try {
    const files = await fs.readdir(dirPath);
    const jsonFiles = files.filter(f => f.endsWith('.json') && !f.endsWith('.backup'));

    console.log(`Found ${jsonFiles.length} file(s) to migrate\n`);

    for (const file of jsonFiles) {
      const filePath = path.join(dirPath, file);
      await migrateFile(filePath, backup);
    }

    console.log(`\n✅ Migration complete!`);
  } catch (error) {
    console.error('Error migrating directory:', error);
    throw error;
  }
}

