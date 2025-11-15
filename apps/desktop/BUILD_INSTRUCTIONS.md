# Portal Fusion Installer Build Instructions

## Quick Build Commands

### Windows (Current Platform)
```bash
cd apps/desktop
npm run build:win
```

This creates:
- **NSIS Installer** (.exe) - `Portal Fusion-1.0.0-win-x64.exe`
- **MSI Installer** (.msi) - `Portal Fusion-1.0.0-win-x64.msi`
- **APPX Package** (.appx) - `Portal Fusion-1.0.0-win-x64.appx`

Output location: `apps/desktop/dist/`

### macOS (Requires macOS System)
```bash
cd apps/desktop
npm run build:mac
```

This creates:
- **DMG Installer** (.dmg) - `Portal Fusion-1.0.0-mac-x64.dmg` (Intel)
- **DMG Installer** (.dmg) - `Portal Fusion-1.0.0-mac-arm64.dmg` (Apple Silicon)
- **PKG Installer** (.pkg) - `Portal Fusion-1.0.0-mac-x64.pkg` (Intel)
- **PKG Installer** (.pkg) - `Portal Fusion-1.0.0-mac-arm64.pkg` (Apple Silicon)
- **ZIP Archive** (.zip) - For manual distribution

**Note**: macOS installers can only be built on a macOS system due to code signing and notarization requirements.

### All Platforms
```bash
cd apps/desktop
npm run build
```

## Build Process

The build script (`scripts/build.js`) automatically:
1. ✅ Checks dependencies
2. ✅ Verifies icons (warns if missing)
3. ✅ Compiles TypeScript
4. ✅ Builds platform-specific installers

## Icon Requirements

Before production builds, create proper icons:

1. **Source Icon**: Create a 1024x1024 PNG with transparent background
2. **Generate Platform Icons**:
   ```bash
   # Install icon generator
   npm install -g electron-icon-builder
   
   # Generate all icons from source
   electron-icon-builder --input=./icon-source.png --output=./assets/icons/
   ```

Required files:
- `assets/icons/icon.icns` - macOS
- `assets/icons/icon.ico` - Windows  
- `assets/icons/icon.png` - Linux

The build will work with default Electron icons if these are missing, but proper icons are required for production.

## Code Signing (Optional but Recommended)

### Windows
Set environment variables before building:
```bash
set CSC_LINK=path\to\certificate.pfx
set CSC_KEY_PASSWORD=your_password
```

### macOS
Set environment variables:
```bash
export APPLE_ID=your@email.com
export APPLE_ID_PASSWORD=app-specific-password
export APPLE_TEAM_ID=XXXXXXXXXX
export CSC_NAME="Developer ID Application: Your Name (TEAMID)"
```

## Troubleshooting

### Build Fails with "Icon not found"
- The build will continue with default icons
- For production, create proper icons as described above

### Windows Build on Non-Windows System
- Install Wine for cross-compilation
- Or use a Windows machine/VM

### macOS Build on Non-macOS System
- **Not possible** - macOS builds require macOS
- Use a Mac, Mac VM, or CI/CD service (GitHub Actions, etc.)

## Output Files

All installers are created in `apps/desktop/dist/`:

```
dist/
├── Portal Fusion-1.0.0-win-x64.exe      # Windows NSIS
├── Portal Fusion-1.0.0-win-x64.msi      # Windows MSI
├── Portal Fusion-1.0.0-win-x64.appx     # Windows Store
├── Portal Fusion-1.0.0-mac-x64.dmg      # macOS DMG (Intel)
├── Portal Fusion-1.0.0-mac-arm64.dmg    # macOS DMG (Apple Silicon)
├── Portal Fusion-1.0.0-mac-x64.pkg      # macOS PKG (Intel)
└── Portal Fusion-1.0.0-mac-arm64.pkg    # macOS PKG (Apple Silicon)
```

## Next Steps

1. **Test Installers**: Install and test on target platforms
2. **Code Sign**: Add code signing certificates for distribution
3. **Notarize** (macOS): Submit for Apple notarization
4. **Distribute**: Upload to GitHub Releases, website, or app stores

For detailed information, see `INSTALLER.md`.

