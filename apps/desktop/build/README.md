# Installer Build Resources

This directory contains resources used for building installers across all platforms.

## Files

### Common
- **license.txt** - License agreement shown during installation ✅
- **installer.nsh** - Custom NSIS installer script for Windows ✅

### Windows Installer Graphics

#### NSIS Installer
- **installer-header.bmp** - Header image for NSIS installer (150x57 px)
- **installer-sidebar.bmp** - Sidebar image for NSIS installer (164x314 px)

These images should:
- Use the Portal Fusion brand colors
- Be in BMP format (24-bit color)
- Follow the exact dimensions specified

#### Example creation with ImageMagick:
```bash
# Create header (150x57)
convert -size 150x57 gradient:#6366F1-#8B5CF6 installer-header.bmp

# Create sidebar (164x314)
convert -size 164x314 gradient:#6366F1-#8B5CF6 installer-sidebar.bmp
```

### macOS Installer Graphics

#### DMG Installer
- **dmg-background.png** - Background for DMG installer window (660x500 px)
  - Should include visual guides for dragging app to Applications
  - Transparent or white background recommended
  - Include branding and visual cues

#### PKG Installer
- **pkg-background.png** - Background for PKG installer (640x480 px)
- **pkg-welcome.html** - Welcome screen HTML
- **pkg-conclusion.html** - Installation complete screen HTML
- **pkg-scripts/** - Pre/post installation scripts directory

### PKG HTML Templates

The welcome and conclusion HTML files should be simple, styled HTML that displays
during the PKG installation process.

Example structure:
```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: -apple-system, sans-serif; padding: 20px; }
        h1 { color: #6366F1; }
    </style>
</head>
<body>
    <h1>Welcome to Portal Fusion</h1>
    <p>This installer will guide you through the installation process.</p>
</body>
</html>
```

## Missing Files

The following files are referenced in package.json but not yet created:

### Windows
- [ ] installer-header.bmp
- [ ] installer-sidebar.bmp

### macOS
- [ ] dmg-background.png
- [ ] pkg-background.png
- [ ] pkg-welcome.html
- [ ] pkg-conclusion.html
- [ ] pkg-scripts/ directory

These files are optional. The installer will build without them, but including them
provides a better user experience.

## Quick Setup

To quickly create placeholder graphics:

```bash
# Install ImageMagick (if not already installed)
# macOS: brew install imagemagick
# Ubuntu: sudo apt-get install imagemagick
# Windows: choco install imagemagick

# Create Windows installer graphics
convert -size 150x57 xc:#6366F1 installer-header.bmp
convert -size 164x314 xc:#8B5CF6 installer-sidebar.bmp

# Create macOS installer graphics
convert -size 660x500 xc:#F3F4F6 dmg-background.png
convert -size 640x480 xc:#F3F4F6 pkg-background.png
```

## Production Builds

For production builds, replace all placeholder graphics with professionally designed
images that match your brand guidelines.
