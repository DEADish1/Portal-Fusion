# Portal Fusion - Cross-Platform Application
**Tagline:** Seamless computing, unified

## Brand Colors
- Primary PC: #2563EB (Deep Blue)
- Primary Mac: #8B5CF6 (Vibrant Purple)  
- Fusion Gradient: #2563EB → #6366F1 → #8B5CF6
- Text Primary: #1F2937
- Text Secondary: #6B7280
- Background: #FFFFFF
- Background Alt: #F9FAFB

## Logo Usage
- App icon: /assets/portal-fusion-icon.svg
- Horizontal: /assets/portal-fusion-horizontal.svg
- Stacked: /assets/portal-fusion-stacked.svg

## Typography
- Display: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
- Body: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
- Monospace: "JetBrains Mono", "SF Mono", Consolas, monospace

## Visual Identity

### Gradient Applications
The fusion gradient represents the seamless connection between PC and Mac platforms:
- Use full gradient for hero sections and primary CTAs
- Use primary colors separately for platform-specific features
- Apply gradient overlay on images for brand consistency

### Icon Style
- Rounded corners (8px radius for standard icons)
- Dual-tone design using brand colors
- Consistent 2px stroke weight
- Minimal, modern aesthetic

## Voice & Tone

### Brand Personality
- **Professional** yet approachable
- **Innovative** without being intimidating  
- **Reliable** and trustworthy
- **Efficient** and powerful

### Messaging Principles
1. **Clarity First**: Technical features explained simply
2. **User-Focused**: Benefits over features
3. **Unified**: Emphasize seamless integration
4. **Empowering**: Enable users to do more

### Example Messaging
- ❌ "Utilizing advanced WebRTC protocols for P2P connectivity"
- ✅ "Connect your devices instantly, no setup required"

- ❌ "Cross-platform file synchronization system"  
- ✅ "Your files, everywhere you need them"

## UI Components

### Buttons
```css
/* Primary Button */
.btn-primary {
  background: linear-gradient(135deg, #2563EB 0%, #8B5CF6 100%);
  color: white;
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: 600;
}

/* Secondary Button */
.btn-secondary {
  background: #F9FAFB;
  color: #1F2937;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 12px 24px;
}
```

### Cards
```css
.card {
  background: white;
  border-radius: 12px;
  border: 1px solid #E5E7EB;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border-color: #6366F1;
}
```

## Platform-Specific Styling

### Windows/PC Context
- Emphasize Primary PC color (#2563EB)
- Square corners (4px radius)
- Segoe UI font family preference
- Fluent Design inspired shadows

### macOS Context
- Emphasize Primary Mac color (#8B5CF6)
- Rounded corners (12px radius)
- SF Pro font family preference
- Vibrancy and translucency effects

### Universal/Connected Context
- Full gradient application
- 8px radius (middle ground)
- Balanced design language
- Emphasis on flow and connection

## Animation Guidelines

### Transitions
- Duration: 200ms for micro, 400ms for macro
- Easing: cubic-bezier(0.4, 0, 0.2, 1)
- Properties: transform, opacity preferred over layout

### Loading States
- Gradient shimmer effect using brand colors
- Pulse animation at 1.5s intervals
- Progress bars use gradient fill

## Iconography

### System Icons
- 24x24px base size
- 2px stroke for outline style
- Gradient fill for emphasis
- Monochrome for secondary actions

### Status Indicators
- 🟢 Connected: #10B981
- 🟡 Syncing: #F59E0B
- 🔴 Disconnected: #EF4444
- 🔵 PC Active: #2563EB
- 🟣 Mac Active: #8B5CF6

## Application Themes

### Light Theme (Default)
```json
{
  "background": "#FFFFFF",
  "backgroundAlt": "#F9FAFB",
  "textPrimary": "#1F2937",
  "textSecondary": "#6B7280",
  "border": "#E5E7EB",
  "primaryPC": "#2563EB",
  "primaryMac": "#8B5CF6"
}
```

### Dark Theme
```json
{
  "background": "#111827",
  "backgroundAlt": "#1F2937",
  "textPrimary": "#F9FAFB",
  "textSecondary": "#9CA3AF",
  "border": "#374151",
  "primaryPC": "#3B82F6",
  "primaryMac": "#9333EA"
}
```

## Marketing Assets

### Screenshots
- Show both PC and Mac in frame
- Gradient overlay on hero images
- Clean, minimal backgrounds
- Real-world use cases

### Social Media
- Square format: Gradient background with icon
- Banner: Horizontal logo on gradient
- Profile: Icon on white background

## File Naming Conventions

### Assets
- Icons: `icon-[name]-[size].svg`
- Images: `img-[context]-[description].png`
- Logos: `logo-[variant]-[color].svg`

### Components
- React: `PortalFusion[Component].tsx`
- Styles: `portal-fusion-[component].css`
- Utils: `pf-[utility].ts`

## Brand Protection

### Dos
- ✅ Use official brand colors
- ✅ Maintain gradient direction (135deg)
- ✅ Keep consistent spacing
- ✅ Follow platform conventions

### Don'ts
- ❌ Alter gradient colors
- ❌ Rotate or distort logos
- ❌ Use off-brand colors for primary actions
- ❌ Mix platform-specific styles inappropriately

## Implementation Checklist

- [ ] Update all package names to Portal Fusion
- [ ] Apply brand colors to UI components
- [ ] Create logo assets in specified formats
- [ ] Update documentation with new branding
- [ ] Configure theme system
- [ ] Update marketing materials
- [ ] Set up brand asset repository

---

**Portal Fusion** - Where platforms converge, productivity emerges.
