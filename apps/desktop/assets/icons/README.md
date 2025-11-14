# Portal Fusion Icons

This directory contains application icons for all platforms.

## Required Icon Files

### macOS
- **icon.icns** - macOS application icon (1024x1024 px)
  - Should include multiple resolutions: 16x16, 32x32, 64x64, 128x128, 256x256, 512x512, 1024x1024
  - Use `iconutil` or tools like [Image2Icon](https://img2icnsapp.com/) to create

### Windows
- **icon.ico** - Windows application icon
  - Should include multiple resolutions: 16x16, 24x24, 32x32, 48x48, 64x64, 128x128, 256x256
  - Use tools like [ICOConvert](https://icoconvert.com/) or GIMP to create

### Linux
- **icon.png** - Main Linux icon (512x512 px)
- Multiple PNG sizes are recommended:
  - 16x16.png
  - 24x24.png
  - 32x32.png
  - 48x48.png
  - 64x64.png
  - 128x128.png
  - 256x256.png
  - 512x512.png
  - 1024x1024.png

## Design Guidelines

The Portal Fusion icon should:
- Represent connectivity and seamless integration
- Use the brand colors (primary: #6366F1)
- Be simple and recognizable at small sizes
- Follow platform-specific design guidelines:
  - macOS: Rounded square with gradient, realistic depth
  - Windows: Flat design with slight perspective
  - Linux: Follow freedesktop.org icon theme specification

## Generating Icons

You can use online tools or these CLI tools:

```bash
# Convert PNG to ICNS (macOS)
# First create an iconset folder with required sizes
mkdir icon.iconset
# Add your PNG files (icon_16x16.png, icon_32x32.png, etc.)
iconutil -c icns icon.iconset -o icon.icns

# Convert PNG to ICO (Windows)
# Using ImageMagick
convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico

# Or use electron-icon-builder
npm install -g electron-icon-builder
electron-icon-builder --input=./icon-source.png --output=./
```

## Placeholder Notice

**⚠️ IMPORTANT**: The current icons are placeholders. Replace these with proper
application icons before distributing the application.

A source icon file (at least 1024x1024 px PNG with transparent background) should
be created and used to generate all platform-specific icons.
