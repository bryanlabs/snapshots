#!/usr/bin/env node

/**
 * Semantic Theme Migration Script - Mag-7 Engineering Quality
 * 
 * Converts existing Tailwind classes to use semantic design tokens.
 * This approach is used by Google, Meta, Apple, and Microsoft for theme consistency.
 * 
 * Strategy:
 * 1. Replace hardcoded colors with semantic tokens (bg-gray-900 → bg-background)
 * 2. Convert dark: prefixes to light: prefixes where appropriate  
 * 3. Use CSS custom properties for consistent theming
 * 4. Maintain accessibility and design consistency
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Semantic token mappings based on our design system
const SEMANTIC_MAPPINGS = {
  // Background mappings
  'bg-white dark:bg-gray-900': 'bg-background',
  'bg-white dark:bg-gray-800': 'bg-background',
  'bg-gray-50 dark:bg-gray-900': 'bg-background',
  'bg-gray-50 dark:bg-gray-800': 'bg-background',
  'bg-gray-100 dark:bg-gray-800': 'bg-card',
  'bg-gray-100 dark:bg-gray-700': 'bg-muted',
  'bg-gray-200 dark:bg-gray-700': 'bg-muted',
  'bg-gray-200 dark:bg-gray-600': 'bg-muted/80',
  
  // Text color mappings
  'text-gray-900 dark:text-white': 'text-foreground',
  'text-gray-900 dark:text-gray-100': 'text-foreground',
  'text-gray-800 dark:text-gray-200': 'text-foreground',
  'text-gray-700 dark:text-gray-300': 'text-muted-foreground',
  'text-gray-600 dark:text-gray-400': 'text-muted-foreground',
  'text-gray-500 dark:text-gray-500': 'text-muted-foreground',
  'text-black dark:text-white': 'text-foreground',
  
  // Border mappings
  'border-gray-200 dark:border-gray-700': 'border-border',
  'border-gray-300 dark:border-gray-600': 'border-border',
  'border-gray-200 dark:border-gray-800': 'border-border',
  
  // Button and interactive element mappings
  'hover:bg-gray-100 dark:hover:bg-gray-800': 'hover:bg-muted',
  'hover:bg-gray-200 dark:hover:bg-gray-700': 'hover:bg-muted/80',
  'hover:text-gray-900 dark:hover:text-white': 'hover:text-foreground',
  
  // Focus states
  'focus:ring-blue-500 dark:focus:ring-blue-400': 'focus:ring-ring',
  'focus:border-blue-500 dark:focus:border-blue-400': 'focus:border-ring',
};

// Individual class replacements (for classes that don't have paired light/dark variants)
const INDIVIDUAL_REPLACEMENTS = {
  // Dark mode defaults (remove dark: prefix since dark is now default)
  'dark:bg-gray-900': 'bg-background',
  'dark:bg-gray-800': 'bg-card',
  'dark:bg-gray-700': 'bg-muted',
  'dark:bg-gray-600': 'bg-muted/80',
  'dark:text-white': 'text-foreground',
  'dark:text-gray-100': 'text-foreground',
  'dark:text-gray-200': 'text-foreground',
  'dark:text-gray-300': 'text-muted-foreground',
  'dark:text-gray-400': 'text-muted-foreground',
  'dark:border-gray-700': 'border-border',
  'dark:border-gray-600': 'border-border',
  'dark:hover:bg-gray-800': 'hover:bg-muted',
  'dark:hover:bg-gray-700': 'hover:bg-muted/80',
  'dark:hover:text-white': 'hover:text-foreground',
  
  // Light mode conversions (add light: prefix for overrides)
  'bg-white': 'bg-background light:bg-white',
  'bg-gray-50': 'bg-background light:bg-gray-50',
  'bg-gray-100': 'bg-card light:bg-gray-100',
  'bg-gray-200': 'bg-muted light:bg-gray-200',
  'text-gray-900': 'text-foreground light:text-gray-900',
  'text-gray-800': 'text-foreground light:text-gray-800',
  'text-gray-700': 'text-muted-foreground light:text-gray-700',
  'text-gray-600': 'text-muted-foreground light:text-gray-600',
  'text-black': 'text-foreground light:text-black',
  'border-gray-200': 'border-border light:border-gray-200',
  'border-gray-300': 'border-border light:border-gray-300',
};

// Brand color mappings
const BRAND_COLORS = {
  'bg-blue-500': 'bg-primary',
  'bg-blue-600': 'bg-primary/90',
  'text-blue-500': 'text-primary',
  'text-blue-600': 'text-primary/90',
  'border-blue-500': 'border-primary',
  'hover:bg-blue-600': 'hover:bg-primary/90',
  'focus:ring-blue-500': 'focus:ring-primary',
};

// Files to exclude from processing
const EXCLUDE_PATTERNS = [
  'node_modules/**/*',
  '.next/**/*',
  'build/**/*',
  'dist/**/*',
  'coverage/**/*',
  '*.d.ts',
  '__tests__/**/*',
  '*.test.*',
  '*.spec.*'
];

class ThemeMigrator {
  constructor() {
    this.stats = {
      filesProcessed: 0,
      filesModified: 0,
      replacements: 0,
      errors: 0
    };
  }

  processFile(filePath) {
    try {
      const originalContent = fs.readFileSync(filePath, 'utf8');
      let content = originalContent;
      let hasChanges = false;
      let fileReplacements = 0;

      // Apply semantic mappings first (paired classes)
      Object.entries(SEMANTIC_MAPPINGS).forEach(([pattern, replacement]) => {
        const regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        const newContent = content.replace(regex, replacement);
        if (newContent !== content) {
          content = newContent;
          hasChanges = true;
          fileReplacements++;
        }
      });

      // Apply individual replacements
      Object.entries(INDIVIDUAL_REPLACEMENTS).forEach(([pattern, replacement]) => {
        const regex = new RegExp(`\\b${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
        const newContent = content.replace(regex, replacement);
        if (newContent !== content) {
          content = newContent;
          hasChanges = true;
          fileReplacements++;
        }
      });

      // Apply brand color mappings
      Object.entries(BRAND_COLORS).forEach(([pattern, replacement]) => {
        const regex = new RegExp(`\\b${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
        const newContent = content.replace(regex, replacement);
        if (newContent !== content) {
          content = newContent;
          hasChanges = true;
          fileReplacements++;
        }
      });

      // Clean up redundant spaces
      content = content.replace(/\s+/g, ' ').replace(/className="\s+/g, 'className="').replace(/\s+"/g, '"');

      if (hasChanges) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ ${filePath} (${fileReplacements} replacements)`);
        this.stats.filesModified++;
        this.stats.replacements += fileReplacements;
      }

      this.stats.filesProcessed++;
      return hasChanges;

    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
      this.stats.errors++;
      return false;
    }
  }

  async migrate() {
    console.log('🎨 Starting semantic theme migration...\n');
    console.log('📋 Migration Strategy:');
    console.log('   • Dark mode as default theme');
    console.log('   • Light mode as .light class override');
    console.log('   • Semantic design tokens for consistency');
    console.log('   • Brand colors mapped to CSS custom properties\n');

    // Find all TypeScript/JavaScript/JSX files
    const patterns = [
      'app/**/*.{tsx,ts,jsx,js}',
      'components/**/*.{tsx,ts,jsx,js}',
      'pages/**/*.{tsx,ts,jsx,js}', // For Pages Router apps
      'src/**/*.{tsx,ts,jsx,js}', // For src directory structure
    ];

    for (const pattern of patterns) {
      try {
        const files = glob.sync(pattern, { 
          cwd: process.cwd(),
          ignore: EXCLUDE_PATTERNS
        });

        for (const file of files) {
          this.processFile(file);
        }
      } catch (error) {
        console.error(`Error processing pattern ${pattern}:`, error.message);
      }
    }

    this.printSummary();
  }

  printSummary() {
    console.log('\n🎉 Migration Complete!\n');
    console.log('📊 Summary:');
    console.log(`   Files processed: ${this.stats.filesProcessed}`);
    console.log(`   Files modified: ${this.stats.filesModified}`);
    console.log(`   Total replacements: ${this.stats.replacements}`);
    console.log(`   Errors: ${this.stats.errors}\n`);

    if (this.stats.filesModified > 0) {
      console.log('✨ Next Steps:');
      console.log('   1. Test your application thoroughly');
      console.log('   2. Check for any visual inconsistencies');
      console.log('   3. Update any custom CSS that uses hardcoded colors');
      console.log('   4. Run your test suite to ensure nothing broke');
      console.log('   5. Consider using semantic tokens in new components\n');
    }

    if (this.stats.errors > 0) {
      console.log('⚠️  Some files had errors. Please review them manually.\n');
    }

    console.log('🔗 Design System Reference:');
    console.log('   • bg-background: Main background color');
    console.log('   • bg-card: Card/elevated surface color'); 
    console.log('   • bg-muted: Subtle background color');
    console.log('   • text-foreground: Primary text color');
    console.log('   • text-muted-foreground: Secondary text color');
    console.log('   • border-border: Border color');
    console.log('   • text-primary: Brand primary color');
    console.log('   • bg-primary: Brand primary background\n');
  }
}

if (require.main === module) {
  const migrator = new ThemeMigrator();
  migrator.migrate().catch(console.error);
}

module.exports = { ThemeMigrator };