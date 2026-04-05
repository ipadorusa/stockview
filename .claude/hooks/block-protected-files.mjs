#!/usr/bin/env node

// PreToolUse hook — Block modifications to protected files
// Exit 0: allow, Exit 2: block with reason message

import { readFileSync } from 'fs';

const PROTECTED_PATTERNS = [
  /^\.env/,                      // .env, .env.local, .env.production
  /^prisma\/migrations\//,       // Existing migration files
  /^\.github\/workflows\//,      // Cron workflow files
];

const CAUTION_PATTERNS = [
  /^src\/proxy\.ts$/,            // Auth middleware
  /^scripts\//,                  // Seeding scripts
];

try {
  const input = JSON.parse(readFileSync('/dev/stdin', 'utf8'));
  const toolInput = input.tool_input || {};
  const filePath = toolInput.file_path || toolInput.path || '';

  // Extract relative path from absolute path
  const cwd = process.cwd();
  const relativePath = filePath.startsWith(cwd)
    ? filePath.slice(cwd.length + 1)
    : filePath;

  // Block protected files
  for (const pattern of PROTECTED_PATTERNS) {
    if (pattern.test(relativePath)) {
      console.error(
        `BLOCKED: "${relativePath}" is a protected file.\n` +
        `Reason: This file should not be modified by agents.\n` +
        `Action: Ask the user for explicit permission first.`
      );
      process.exit(2);
    }
  }

  // Warn on caution files (don't block)
  for (const pattern of CAUTION_PATTERNS) {
    if (pattern.test(relativePath)) {
      console.error(
        `WARNING: "${relativePath}" requires careful modification.\n` +
        `Proceed with caution and verify changes thoroughly.`
      );
    }
  }

  process.exit(0);
} catch (e) {
  // On parse failure, allow (fail-safe)
  process.exit(0);
}
