#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Build script for Portal Fusion
 * Handles pre-build checks and builds installers for all platforms
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(message) {
  log('', 'reset');
  log('━'.repeat(60), 'cyan');
  log(`  ${message}`, 'bright');
  log('━'.repeat(60), 'cyan');
  log('', 'reset');
}

function checkIcons() {
  header('Checking Icons');

  const iconsDir = path.join(__dirname, '../assets/icons');
  const requiredIcons = {
    'icon.icns': 'macOS icon',
    'icon.ico': 'Windows icon',
    'icon.png': 'Linux icon',
  };

  let allIconsPresent = true;

  for (const [filename, description] of Object.entries(requiredIcons)) {
    const iconPath = path.join(iconsDir, filename);
    if (fs.existsSync(iconPath)) {
      log(`✓ ${description} found: ${filename}`, 'green');
    } else {
      log(`✗ ${description} missing: ${filename}`, 'red');
      allIconsPresent = false;
    }
  }

  if (!allIconsPresent) {
    log('', 'reset');
    log('⚠️  Some icons are missing. The build will continue with placeholder icons.', 'yellow');
    log('   For production builds, create proper icons in assets/icons/', 'yellow');
    log('   See assets/icons/README.md for details.', 'yellow');
  }

  return allIconsPresent;
}

function checkDependencies() {
  header('Checking Dependencies');

  try {
    const packageJson = require('../package.json');
    const requiredDeps = ['electron', 'electron-builder'];

    for (const dep of requiredDeps) {
      if (packageJson.devDependencies[dep]) {
        log(`✓ ${dep} found`, 'green');
      } else {
        log(`✗ ${dep} missing`, 'red');
        throw new Error(`Missing dependency: ${dep}`);
      }
    }
  } catch (error) {
    log(`Error checking dependencies: ${error.message}`, 'red');
    process.exit(1);
  }
}

function compile() {
  header('Compiling TypeScript');

  try {
    log('Running TypeScript compiler...', 'cyan');
    execSync('npm run compile', { stdio: 'inherit', cwd: __dirname + '/..' });
    log('✓ Compilation complete', 'green');
  } catch (error) {
    log('✗ Compilation failed', 'red');
    process.exit(1);
  }
}

function build(platform) {
  header(`Building for ${platform}`);

  const commands = {
    win: 'electron-builder --win',
    mac: 'electron-builder --mac',
    linux: 'electron-builder --linux',
    all: 'electron-builder -mwl',
  };

  const command = commands[platform];
  if (!command) {
    log(`Unknown platform: ${platform}`, 'red');
    log(`Available platforms: ${Object.keys(commands).join(', ')}`, 'yellow');
    process.exit(1);
  }

  try {
    log(`Running: ${command}`, 'cyan');
    execSync(command, { stdio: 'inherit', cwd: __dirname + '/..' });
    log(`✓ Build complete for ${platform}`, 'green');
  } catch (error) {
    log(`✗ Build failed for ${platform}`, 'red');
    process.exit(1);
  }
}

function showBuildInfo() {
  header('Build Information');

  const packageJson = require('../package.json');

  log(`App Name:     ${packageJson.productName}`, 'cyan');
  log(`Version:      ${packageJson.version}`, 'cyan');
  log(`App ID:       ${packageJson.build.appId}`, 'cyan');
  log(`Output Dir:   ${packageJson.build.directories.output}`, 'cyan');
  log('', 'reset');
}

function printUsage() {
  log('', 'reset');
  log('Usage: node scripts/build.js [platform]', 'bright');
  log('', 'reset');
  log('Platforms:', 'bright');
  log('  win      Build Windows installer (NSIS, MSI, APPX)', 'cyan');
  log('  mac      Build macOS installer (DMG, ZIP)', 'cyan');
  log('  linux    Build Linux packages (AppImage, deb, rpm, snap)', 'cyan');
  log('  all      Build for all platforms', 'cyan');
  log('', 'reset');
  log('Examples:', 'bright');
  log('  node scripts/build.js win', 'cyan');
  log('  node scripts/build.js mac', 'cyan');
  log('  node scripts/build.js all', 'cyan');
  log('', 'reset');
}

function main() {
  const platform = process.argv[2] || 'all';

  if (platform === '--help' || platform === '-h') {
    printUsage();
    process.exit(0);
  }

  header('Portal Fusion Installer Builder');

  showBuildInfo();
  checkDependencies();
  checkIcons();
  compile();
  build(platform);

  header('Build Complete! 🎉');

  log('', 'reset');
  log('Your installers are in the "dist" directory', 'green');
  log('', 'reset');
}

main();
