# Portal Fusion SVG Assets

All Portal Fusion logo assets in SVG format with proper optimization and variations for different use cases.

## Core Logos

### 1. **portal-fusion-icon.svg** (64x64)
Standard icon with overlapping rectangles
- PC Rectangle: `#2563EB` (blue)
- Mac Rectangle: `#8B5CF6` (purple)
- Fusion Area: Linear gradient
- Use: Default app icon, navigation, buttons

### 2. **portal-fusion-horizontal.svg** (240x64)
Horizontal layout with text
- Icon + "Portal Fusion" text
- Includes tagline option
- Use: Headers, navigation bars, marketing

### 3. **portal-fusion-vertical.svg** (128x160)
Stacked vertical layout
- Icon above text
- Centered alignment
- Use: Splash screens, login pages, mobile

## Animated Versions

### 4. **portal-fusion-icon-animated.svg** (64x64)
Subtle animation effects
- Breathing effect on rectangles
- Pulsing fusion area
- Use: Loading states, interactive elements

### 5. **portal-fusion-connecting.svg** (64x64)
Connection animation
- Rectangles slide together
- Fusion area fades in
- Use: Connection status, pairing process

### 6. **portal-fusion-spinner.svg** (64x64)
Loading spinner version
- Rotating entire logo
- Opacity animation
- Use: Loading screens, processing states

## Size Variants

### 7. **portal-fusion-favicon.svg** (16x16)
Optimized for tiny sizes
- Simplified shapes
- Reduced corner radius
- Use: Browser favicon, tiny icons

### 8. **portal-fusion-icon-hd.svg** (256x256)
High-resolution with effects
- Gradient backgrounds
- Shadow effects
- Glow on fusion area
- Use: Marketing, large displays

### 9. **portal-fusion-app-icon.svg** (1024x1024)
App store ready icon
- Full gradient backgrounds
- Platform-specific masks
- Enhanced depth effects
- Use: iOS/Android app icons

## Special Versions

### 10. **portal-fusion-mono.svg** (64x64)
Monochrome version
- Single color with opacity layers
- Uses `currentColor`
- Use: Single-color contexts, icons fonts

## Color Reference

| Element | Hex Code | RGB | Usage |
|---------|----------|-----|-------|
| PC Blue | `#2563EB` | 37, 99, 235 | Left rectangle |
| Fusion Indigo | `#6366F1` | 99, 102, 241 | Center overlap |
| Mac Purple | `#8B5CF6` | 139, 92, 246 | Right rectangle |
| Text Gray | `#6B7280` | 107, 114, 128 | Taglines |

## Gradients

### Primary Gradient
```xml
<linearGradient id="fusion" x1="0%" y1="0%" x2="100%" y2="0%">
  <stop offset="0%" style="stop-color:#2563EB;stop-opacity:1" />
  <stop offset="50%" style="stop-color:#6366F1;stop-opacity:1" />
  <stop offset="100%" style="stop-color:#8B5CF6;stop-opacity:1" />
</linearGradient>
```

## Usage Guidelines

### Web Implementation
```html
<!-- Inline SVG -->
<img src="/assets/portal-fusion-icon.svg" alt="Portal Fusion" width="64" height="64">

<!-- As CSS background -->
.logo {
  background-image: url('/assets/portal-fusion-icon.svg');
  width: 64px;
  height: 64px;
}
```

### React Component
```jsx
import { ReactComponent as Logo } from './assets/portal-fusion-icon.svg';

<Logo className="w-16 h-16 text-blue-600" />
```

### Icon Sizes
- Favicon: 16x16, 32x32
- Touch icon: 180x180
- App icon: 1024x1024
- Social media: 512x512
- Navigation: 64x64
- Marketing: 256x256+

## File Organization
```
assets/
├── portal-fusion-icon.svg           # Default icon
├── portal-fusion-icon-animated.svg  # Animated version
├── portal-fusion-horizontal.svg     # With text
├── portal-fusion-vertical.svg       # Stacked
├── portal-fusion-favicon.svg        # Tiny version
├── portal-fusion-mono.svg           # Single color
├── portal-fusion-icon-hd.svg        # High-res
├── portal-fusion-app-icon.svg       # App stores
├── portal-fusion-connecting.svg     # Connection anim
└── portal-fusion-spinner.svg        # Loading state
```

## Export Tips

### For Production
1. Optimize with SVGO: `svgo input.svg -o output.svg`
2. Convert to PNG for fallbacks: `svg2png -w 1024 -h 1024`
3. Create icon font: Include mono version
4. Generate favicon set: Use favicon.svg as source

### Platform Specific
- **iOS**: Use app-icon.svg, export at 1024x1024
- **Android**: Use icon.svg, export multiple densities
- **Windows**: Use icon-hd.svg for tiles
- **macOS**: Use app-icon.svg with proper masks

## Accessibility
- All SVGs include proper viewBox
- Can scale without quality loss
- Support for high contrast modes (mono version)
- Animated versions respect prefers-reduced-motion

---

*Portal Fusion - Where platforms converge, productivity emerges* 🌀
