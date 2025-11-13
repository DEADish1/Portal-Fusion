# Portal Fusion Application Metadata

This directory contains all application metadata and configuration files for Portal Fusion across different platforms and deployment targets.

## 📁 File Structure

```
portal-fusion/
├── app-metadata.json              # Master metadata configuration
├── package.json                   # Node.js package metadata
├── public/
│   └── manifest.json              # PWA Web App Manifest
├── apps/
│   ├── desktop/
│   │   ├── package.json          # Electron app configuration
│   │   ├── Info.plist            # macOS app metadata
│   │   └── Package.appxmanifest  # Windows Store metadata
│   └── web/
│       └── src/
│           └── config/
│               └── metadata.ts    # Next.js SEO metadata
└── packages/
    └── shared/
        └── src/
            └── constants/
                └── app.constants.ts  # Centralized app constants
```

## 🔧 Configuration Files

### 1. **app-metadata.json**
Master metadata file containing:
- Application identity (name, version, description)
- Brand colors and visual identity
- Platform configurations
- Feature flags
- Links and URLs
- Legal information

### 2. **manifest.json** (PWA)
Web app manifest for Progressive Web App features:
- App icons and screenshots
- Theme colors
- Display modes
- Protocol handlers
- Share targets

### 3. **Electron Configuration**
Desktop app settings in `apps/desktop/package.json`:
- Build configurations for Windows, macOS, Linux
- Code signing settings
- Auto-update configuration
- Platform-specific options

### 4. **Platform-Specific Metadata**

#### Windows (Package.appxmanifest)
- Microsoft Store listing information
- Capabilities and permissions
- File associations
- Protocol handlers

#### macOS (Info.plist)
- Bundle information
- Privacy usage descriptions
- Document types
- URL schemes

## 🎨 Brand Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Primary (PC) | `#2563EB` | Windows/PC branding |
| Secondary (Mac) | `#8B5CF6` | macOS branding |
| Accent (Fusion) | `#6366F1` | Unified/fusion elements |

## 📝 Updating Metadata

### Version Updates
Update version in these files:
1. `app-metadata.json` - Master version
2. `package.json` (root) - Node package version
3. `apps/desktop/package.json` - Electron app version
4. `apps/desktop/Info.plist` - CFBundleVersion
5. `apps/desktop/Package.appxmanifest` - Version attribute

### Application Name Changes
Update in:
1. `app-metadata.json`
2. All `package.json` files
3. `manifest.json`
4. Platform-specific files (Info.plist, Package.appxmanifest)
5. `app.constants.ts`

### Description Updates
1. `app-metadata.json` - Master description
2. `package.json` files - description field
3. `manifest.json` - description field
4. `metadata.ts` - SEO description

### Icon Updates
Place new icons in `/assets/icons/` and update:
1. `manifest.json` - icons array
2. `apps/desktop/package.json` - build.mac.icon, build.win.icon
3. `Info.plist` - CFBundleIconFile
4. `Package.appxmanifest` - Logo elements

## 🚀 Platform Deployment

### Web (PWA)
```bash
# Uses manifest.json automatically
npm run build:web
```

### Electron Desktop
```bash
# Uses desktop/package.json configuration
npm run build:desktop
```

### Windows Store
```bash
# Uses Package.appxmanifest
npm run build:appx
```

### macOS App Store
```bash
# Uses Info.plist
npm run build:mac
```

## 🔐 Code Signing

### Windows
- Update `publisherName` in desktop/package.json
- Set certificate in environment variables

### macOS
- Update Team ID in Info.plist
- Configure notarization in build scripts

## 📊 Analytics Configuration

Update tracking IDs in `app.constants.ts`:
- Google Analytics: `ANALYTICS.googleAnalyticsId`
- Mixpanel: `ANALYTICS.mixpanelToken`
- Sentry: `ANALYTICS.sentryDsn`

## 🌐 URL Configuration

All URLs are centralized in:
- `app-metadata.json` - links object
- `app.constants.ts` - URLS object

Update both when changing:
- Website URL
- Documentation URL
- Support URL
- Social media links

## 📋 Metadata Checklist

When preparing for release, ensure:

- [ ] Version numbers are synchronized
- [ ] Descriptions are consistent
- [ ] Icons are present in all required sizes
- [ ] Platform requirements are accurate
- [ ] Privacy descriptions are complete (macOS)
- [ ] Capabilities are properly declared (Windows)
- [ ] URLs are valid and accessible
- [ ] Copyright year is current
- [ ] Author information is correct
- [ ] License type is specified

## 🛠️ Validation Tools

### Manifest Validation
```bash
# Validate PWA manifest
npx pwa-manifest-validator public/manifest.json
```

### Info.plist Validation
```bash
# On macOS
plutil -lint apps/desktop/Info.plist
```

### Package.appxmanifest Validation
Use Visual Studio or Windows SDK tools to validate

## 📚 Resources

- [Web App Manifest Spec](https://www.w3.org/TR/appmanifest/)
- [Electron Builder Docs](https://www.electron.build/)
- [Apple Info.plist Reference](https://developer.apple.com/documentation/bundleresources/information_property_list)
- [Windows App Package Manifest](https://docs.microsoft.com/en-us/uwp/schemas/appxpackage/appx-package-manifest)

---

**Portal Fusion** - Where platforms converge, productivity emerges 🌀
