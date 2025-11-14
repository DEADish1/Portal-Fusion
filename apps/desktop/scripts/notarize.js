const { notarize } = require('electron-notarize');
const path = require('path');

/**
 * Notarize macOS application
 * This is required for macOS apps to run without security warnings
 *
 * Required environment variables:
 * - APPLE_ID: Your Apple ID email
 * - APPLE_ID_PASSWORD: App-specific password (not your Apple ID password)
 * - APPLE_TEAM_ID: Your Apple Developer Team ID
 */
exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;

  // Only notarize for macOS
  if (electronPlatformName !== 'darwin') {
    return;
  }

  // Skip if credentials are not provided
  if (!process.env.APPLE_ID || !process.env.APPLE_ID_PASSWORD || !process.env.APPLE_TEAM_ID) {
    console.log('⚠️  Skipping notarization: Apple credentials not found in environment');
    console.log('   Set APPLE_ID, APPLE_ID_PASSWORD, and APPLE_TEAM_ID to enable notarization');
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  const appPath = path.join(appOutDir, `${appName}.app`);

  console.log(`🍎 Notarizing ${appName} at ${appPath}...`);

  try {
    await notarize({
      appBundleId: 'com.portalfusion.mac',
      appPath: appPath,
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_ID_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID,
    });

    console.log('✅ Notarization complete');
  } catch (error) {
    console.error('❌ Notarization failed:', error);
    throw error;
  }
};
