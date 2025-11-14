# Portal Fusion Installer Guide

This guide explains how to build installers for Portal Fusion across all supported platforms.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Building Installers](#building-installers)
- [Platform-Specific Details](#platform-specific-details)
- [Code Signing](#code-signing)
- [Distribution](#distribution)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- **Node.js** >= 18.0.0
- **npm** >= 10.0.0
- **Git**

### Platform-Specific Requirements

#### Windows
- No additional requirements for building Windows installers
- For code signing: Windows Code Signing Certificate

#### macOS
- **Xcode Command Line Tools**: `xcode-select --install`
- For code signing: Apple Developer account
- For notarization: App-specific password

#### Linux
- Standard build tools: `build-essential` (Ubuntu/Debian) or `base-devel` (Arch)
- For AppImage: `fuse` and `libfuse2`

## Quick Start

```bash
# Install dependencies
cd apps/desktop
npm install

# Build for current platform
npm run build

# Or build for specific platform
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

## Building Installers

### Build Scripts

Portal Fusion provides several build scripts:

```bash
# Build all platforms
npm run build

# Build specific platform
npm run build:win     # Windows (NSIS, MSI, APPX)
npm run build:mac     # macOS (DMG, PKG, ZIP)
npm run build:linux   # Linux (AppImage, deb, rpm, snap)

# Quick build (unpacked directory only, no installer)
npm run build:quick

# Show build help
npm run installer:help
```

### Custom Build Script

The custom build script (`scripts/build.js`) provides:

- ✅ Pre-build dependency checks
- ✅ Icon verification
- ✅ TypeScript compilation
- ✅ Colorized output
- ✅ Detailed progress reporting

### Output

Built installers will be in the `dist/` directory:

```
dist/
├── Portal Fusion-1.0.0-win-x64.exe        # Windows NSIS installer
├── Portal Fusion-1.0.0-win-x64.msi        # Windows MSI installer
├── Portal Fusion-1.0.0-mac-x64.dmg        # macOS DMG (Intel)
├── Portal Fusion-1.0.0-mac-arm64.dmg      # macOS DMG (Apple Silicon)
├── Portal Fusion-1.0.0-mac-x64.pkg        # macOS PKG (Intel)
├── Portal Fusion-1.0.0-mac-arm64.pkg      # macOS PKG (Apple Silicon)
├── Portal Fusion-1.0.0-linux-x86_64.AppImage  # Linux AppImage
├── Portal Fusion-1.0.0-linux-amd64.deb    # Debian/Ubuntu package
├── Portal Fusion-1.0.0-linux-x86_64.rpm   # RedHat/Fedora package
└── Portal Fusion-1.0.0-linux-amd64.snap   # Snap package
```

## Platform-Specific Details

### Windows

#### NSIS Installer (.exe)

The default Windows installer format. Features:
- **Installation directory selection**
- **Desktop & Start Menu shortcuts**
- **Auto-updates support**
- **Firewall rule configuration**
- **Clean uninstallation**

Configuration in `package.json`:
```json
"nsis": {
  "oneClick": false,
  "allowToChangeInstallationDirectory": true,
  "createDesktopShortcut": true,
  "createStartMenuShortcut": true,
  "runAfterFinish": true,
  "license": "build/license.txt",
  "include": "build/installer.nsh"
}
```

Custom installer behavior is defined in `build/installer.nsh`.

#### MSI Installer (.msi)

Windows Installer package for enterprise deployments. Features:
- **Group Policy deployment support**
- **System Center integration**
- **Per-machine installation**
- **Administrative installation**

#### APPX Package

Microsoft Store compatible package. Features:
- **Windows Store distribution**
- **Automatic updates via Store**
- **Sandboxed execution**

### macOS

#### DMG Installer (.dmg)

Standard macOS disk image installer. Features:
- **Drag-to-Applications installation**
- **Custom background image**
- **Code signing & notarization**
- **Universal binary support (Intel + Apple Silicon)**

Configuration:
```json
"dmg": {
  "backgroundColor": "#FFFFFF",
  "background": "build/dmg-background.png",
  "iconSize": 100,
  "window": { "width": 660, "height": 500 }
}
```

#### PKG Installer (.pkg)

macOS package installer for programmatic deployment. Features:
- **Pre/post installation scripts**
- **Custom welcome & conclusion screens**
- **Command-line installation support**
- **MDM deployment compatible**

### Linux

#### AppImage

Universal Linux package that runs on all distributions. Features:
- **No installation required**
- **Runs on any Linux distro**
- **Self-contained with all dependencies**

#### DEB Package (.deb)

For Debian-based distributions (Ubuntu, Mint, etc.). Features:
- **APT integration**
- **Dependency management**
- **System integration**

```bash
# Install on Ubuntu/Debian
sudo dpkg -i Portal-Fusion-1.0.0-linux-amd64.deb
sudo apt-get install -f  # Fix dependencies
```

#### RPM Package (.rpm)

For RedHat-based distributions (Fedora, CentOS, etc.). Features:
- **DNF/YUM integration**
- **Dependency management**
- **System integration**

```bash
# Install on Fedora/RHEL
sudo rpm -i Portal-Fusion-1.0.0-linux-x86_64.rpm
```

#### Snap Package (.snap)

Universal Linux package with sandboxing. Features:
- **Automatic updates**
- **Sandboxed execution**
- **Cross-distro compatibility**

```bash
# Install snap
sudo snap install portal-fusion-1.0.0-linux-amd64.snap --dangerous
```

## Code Signing

### Windows Code Signing

Required for avoiding "Unknown Publisher" warnings.

1. **Obtain a Code Signing Certificate**
   - Purchase from DigiCert, Sectigo, or similar CA
   - Or use a self-signed certificate for testing

2. **Set Environment Variables**
   ```bash
   set CSC_LINK=path\to\certificate.pfx
   set CSC_KEY_PASSWORD=your_certificate_password
   ```

3. **Build with signing**
   ```bash
   npm run build:win
   ```

### macOS Code Signing & Notarization

Required for Gatekeeper approval on macOS.

1. **Join Apple Developer Program**
   - Sign up at https://developer.apple.com

2. **Create App-Specific Password**
   - Go to https://appleid.apple.com
   - Generate app-specific password

3. **Set Environment Variables**
   ```bash
   export APPLE_ID=your@email.com
   export APPLE_ID_PASSWORD=xxxx-xxxx-xxxx-xxxx
   export APPLE_TEAM_ID=XXXXXXXXXX
   export CSC_NAME="Developer ID Application: Your Name (TEAMID)"
   ```

4. **Build with signing and notarization**
   ```bash
   npm run build:mac
   ```

The `scripts/notarize.js` script handles notarization automatically.

### Linux Code Signing

Optional, but recommended for some distributions.

```bash
# Sign AppImage
gpg --detach-sign Portal-Fusion-1.0.0-linux-x86_64.AppImage
```

## Distribution

### GitHub Releases

Automatically publish to GitHub Releases:

```bash
# Set GitHub token
export GH_TOKEN=your_github_token

# Build and publish
npm run dist
```

Configuration in `package.json`:
```json
"publish": [{
  "provider": "github",
  "owner": "yourusername",
  "repo": "portal-fusion",
  "releaseType": "release"
}]
```

### Auto-Updates

Portal Fusion includes `electron-updater` for automatic updates.

The update check happens on app startup and periodically. Users are notified
when a new version is available.

Configuration is in `apps/desktop/src/main/updater.ts`.

## Troubleshooting

### Common Issues

#### "Icon not found" error

**Solution**: Create or provide icon files in `assets/icons/`:
- `icon.icns` for macOS
- `icon.ico` for Windows
- `icon.png` for Linux

See `assets/icons/README.md` for details.

#### "Cannot find module" after build

**Solution**: Ensure all dependencies are listed in `dependencies` (not `devDependencies`):
```bash
npm run postinstall
```

#### Windows build fails on macOS/Linux

**Solution**: Install Wine for cross-platform builds:
```bash
# macOS
brew install --cask wine-stable

# Ubuntu
sudo apt-get install wine64
```

Then build normally.

#### macOS notarization fails

**Solution**: Check the following:
1. Valid Apple ID and app-specific password
2. Correct Team ID
3. Valid Developer ID certificate in Keychain
4. Hardened runtime enabled (already configured)

Check notarization status:
```bash
xcrun altool --notarization-history 0 -u "your@email.com" -p "xxxx-xxxx-xxxx-xxxx"
```

#### Linux AppImage doesn't run

**Solution**: Ensure FUSE is installed and AppImage is executable:
```bash
sudo apt-get install fuse libfuse2
chmod +x Portal-Fusion-1.0.0-linux-x86_64.AppImage
./Portal-Fusion-1.0.0-linux-x86_64.AppImage
```

### Build Cache Issues

If builds behave unexpectedly, clear the build cache:

```bash
npm run clean
rm -rf node_modules
npm install
npm run build
```

### Debug Build Process

Enable verbose logging:

```bash
# Set debug environment variable
export DEBUG=electron-builder

# Build with verbose output
npm run build
```

## Advanced Configuration

### Custom Installer Behavior

#### Windows (NSIS)
Edit `build/installer.nsh` to customize:
- Installation checks
- Firewall rules
- Registry entries
- Startup configuration

#### macOS (PKG)
Edit `build/pkg-scripts/` to customize:
- Pre-installation checks
- Post-installation tasks
- Permission setup
- Service installation

### Multi-Platform Builds

Build for all platforms from a single machine:

```bash
# Install dependencies
npm install

# Build everything
npm run build

# Specific architectures
electron-builder --win --x64 --ia32 --arm64
electron-builder --mac --x64 --arm64
electron-builder --linux --x64 --armv7l --arm64
```

### CI/CD Integration

Example GitHub Actions workflow:

```yaml
name: Build Installers

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [macos-latest, windows-latest, ubuntu-latest]

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm install

      - name: Build
        run: npm run build
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: installers-${{ matrix.os }}
          path: apps/desktop/dist/*
```

## Resources

- **Electron Builder Docs**: https://www.electron.build
- **Code Signing Guide**: https://www.electron.build/code-signing
- **Auto Updates**: https://www.electron.build/auto-update
- **Icon Generator**: https://github.com/electron/asar

## Support

For installer-related issues:
1. Check this documentation
2. Review electron-builder logs
3. Search [GitHub Issues](https://github.com/yourusername/portal-fusion/issues)
4. Create a new issue with build logs

---

**Happy Building!** 🚀
