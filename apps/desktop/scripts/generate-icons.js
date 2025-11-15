#!/usr/bin/env node

/**
 * Generate placeholder icons for Portal Fusion
 * Creates basic icons from SVG source or generates simple placeholder icons
 */

const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '../assets/icons');
const sourceIcon = path.join(__dirname, '../../../assets/portal-fusion-icon.svg');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('Generating placeholder icons...');
console.log('Note: For production, replace these with proper icons generated from a 1024x1024 PNG source.');

// Create a simple note file
const noteContent = `# Placeholder Icons

These are placeholder icons. For production builds:

1. Create a 1024x1024 PNG icon with transparent background
2. Use electron-icon-builder or similar tools to generate:
   - icon.icns (macOS)
   - icon.ico (Windows)
   - icon.png (Linux)

See assets/icons/README.md for detailed instructions.

The build will continue with default Electron icons if these files are missing.
`;

fs.writeFileSync(path.join(iconsDir, 'PLACEHOLDER.txt'), noteContent);

console.log('✓ Placeholder note created');
console.log('⚠️  Build will use default Electron icons');
console.log('   Create proper icons before production release!');

