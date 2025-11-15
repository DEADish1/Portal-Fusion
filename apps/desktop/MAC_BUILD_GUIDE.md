# Building macOS Installers for Portal Fusion

## ⚠️ Important: macOS Build Requirements

**macOS installers CANNOT be built on Windows**. You need:

1. **macOS System** (Mac, Mac VM, or CI/CD service)
2. **Xcode Command Line Tools**
3. **Apple Developer Account** (for code signing - optional but recommended)

## 🚀 Quick Start on macOS

### 1. Prerequisites

```bash
# Install Xcode Command Line Tools (if not already installed)
xcode-select --install

# Verify installation
xcode-select -p
```

### 2. Build macOS Installers

```bash
# Navigate to desktop app directory
cd apps/desktop

# Install dependencies (if not already done)
npm install

# Build macOS installers
npm run build:mac
```

### 3. Output Files

After building, you'll find in `apps/desktop/dist/`:

- **DMG Files** (Disk Images):
  - `Portal Fusion-1.0.0-mac-x64.dmg` - Intel Mac
  - `Portal Fusion-1.0.0-mac-arm64.dmg` - Apple Silicon (M1/M2/M3)

- **PKG Files** (Package Installers):
  - `Portal Fusion-1.0.0-mac-x64.pkg` - Intel Mac
  - `Portal Fusion-1.0.0-mac-arm64.pkg` - Apple Silicon

- **ZIP Files** (Archives):
  - `Portal Fusion-1.0.0-mac-x64.zip` - Intel Mac
  - `Portal Fusion-1.0.0-mac-arm64.zip` - Apple Silicon

## 🔐 Code Signing (Recommended)

### Setup

1. **Join Apple Developer Program**
   - Sign up at https://developer.apple.com
   - Cost: $99/year

2. **Create App-Specific Password**
   - Go to https://appleid.apple.com
   - Sign in → App-Specific Passwords
   - Generate password for "Portal Fusion Build"

3. **Set Environment Variables**

```bash
export APPLE_ID=your@email.com
export APPLE_ID_PASSWORD=xxxx-xxxx-xxxx-xxxx  # App-specific password
export APPLE_TEAM_ID=XXXXXXXXXX  # Your Team ID from developer.apple.com
export CSC_NAME="Developer ID Application: Your Name (TEAMID)"
```

4. **Build with Signing**

```bash
npm run build:mac
```

The build script will automatically:
- Sign the application
- Submit for notarization
- Wait for approval
- Staple the notarization ticket

## 🏗️ CI/CD Build (GitHub Actions)

If you don't have a Mac, use GitHub Actions:

### Create `.github/workflows/build-mac.yml`:

```yaml
name: Build macOS Installers

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:

jobs:
  build-mac:
    runs-on: macos-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: |
          cd apps/desktop
          npm install
      
      - name: Build macOS installers
        run: |
          cd apps/desktop
          npm run build:mac
        env:
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_ID_PASSWORD: ${{ secrets.APPLE_ID_PASSWORD }}
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
          CSC_NAME: ${{ secrets.CSC_NAME }}
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: macos-installers
          path: apps/desktop/dist/*.dmg
          retention-days: 30
```

### Setup GitHub Secrets:

1. Go to your repository → Settings → Secrets and variables → Actions
2. Add these secrets:
   - `APPLE_ID` - Your Apple ID email
   - `APPLE_ID_PASSWORD` - App-specific password
   - `APPLE_TEAM_ID` - Your Team ID
   - `CSC_NAME` - Certificate name

## 📦 Installer Formats Explained

### DMG (Disk Image)
- **Best for**: End-user distribution
- **Installation**: Drag app to Applications folder
- **Features**: Custom background, icon positioning
- **File Size**: ~150-200 MB

### PKG (Package)
- **Best for**: Enterprise/MDM deployment
- **Installation**: Double-click or command-line
- **Features**: Pre/post-install scripts, custom screens
- **File Size**: ~150-200 MB

### ZIP (Archive)
- **Best for**: Manual distribution, testing
- **Installation**: Extract and run
- **Features**: No installer UI
- **File Size**: ~150-200 MB

## 🧪 Testing macOS Installers

### Test DMG:
```bash
# Mount DMG
hdiutil attach "Portal Fusion-1.0.0-mac-x64.dmg"

# Install (drag to Applications)
# Or use command line:
cp -R "/Volumes/Portal Fusion/Portal Fusion.app" /Applications/

# Unmount
hdiutil detach "/Volumes/Portal Fusion"
```

### Test PKG:
```bash
# Install via command line
sudo installer -pkg "Portal Fusion-1.0.0-mac-x64.pkg" -target /
```

### Verify Code Signing:
```bash
# Check signature
codesign -dv --verbose=4 "Portal Fusion.app"

# Verify notarization
spctl -a -vv "Portal Fusion.app"
```

## 🐛 Troubleshooting

### "Xcode Command Line Tools not found"
```bash
xcode-select --install
sudo xcode-select --switch /Library/Developer/CommandLineTools
```

### "Notarization failed"
- Check Apple ID and password are correct
- Verify Team ID matches your developer account
- Check certificate is valid in Keychain
- Review notarization logs:
  ```bash
  xcrun altool --notarization-history 0 -u "$APPLE_ID" -p "$APPLE_ID_PASSWORD"
  ```

### "Gatekeeper blocks app"
- App must be signed and notarized
- Users may need to right-click → Open (first time)
- Or disable Gatekeeper (not recommended):
  ```bash
  sudo spctl --master-disable
  ```

### Build fails with "icon.icns not found"
- Build will continue with default icons
- For production, create proper icons:
  ```bash
  # Generate from PNG source
  electron-icon-builder --input=./icon-source.png --output=./assets/icons/
  ```

## 📋 Build Checklist

Before building for production:

- [ ] App compiles without errors
- [ ] Icons created (icon.icns, icon.ico, icon.png)
- [ ] Version number updated in package.json
- [ ] Apple Developer account set up (for signing)
- [ ] Environment variables configured
- [ ] Test build on clean macOS system
- [ ] Verify code signing
- [ ] Test notarization
- [ ] Test installation on target Macs

## 🔗 Resources

- **Apple Developer**: https://developer.apple.com
- **Electron Builder Docs**: https://www.electron.build
- **Code Signing Guide**: https://www.electron.build/code-signing
- **Notarization Guide**: https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution

## 💡 Tips

1. **Universal Binaries**: The build creates both Intel and Apple Silicon versions automatically
2. **Notarization Time**: First-time notarization can take 10-30 minutes
3. **Test on Both Architectures**: Test on Intel Mac and Apple Silicon Mac if possible
4. **Keep Certificates Safe**: Store Apple Developer credentials securely
5. **CI/CD is Your Friend**: Use GitHub Actions for automated builds

---

**Ready to build?** Run `npm run build:mac` on a macOS system!

