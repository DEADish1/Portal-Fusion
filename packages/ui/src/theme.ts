// Portal Fusion Theme Configuration
// Brand colors and design tokens

export const colors = {
  // Brand Colors
  primary: {
    pc: '#2563EB',        // Deep Blue
    mac: '#8B5CF6',       // Vibrant Purple
    fusion: '#6366F1',    // Middle gradient color
  },
  
  // Gradient
  gradient: {
    fusion: 'linear-gradient(135deg, #2563EB 0%, #6366F1 50%, #8B5CF6 100%)',
    fusionHover: 'linear-gradient(135deg, #1D4ED8 0%, #5558E8 50%, #7C3AED 100%)',
    fusionSubtle: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(99, 102, 241, 0.1) 50%, rgba(139, 92, 246, 0.1) 100%)',
  },
  
  // Text Colors
  text: {
    primary: '#1F2937',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
    inverse: '#FFFFFF',
  },
  
  // Background Colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F9FAFB',
    tertiary: '#F3F4F6',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  
  // UI Colors
  ui: {
    border: '#E5E7EB',
    borderHover: '#D1D5DB',
    divider: '#F3F4F6',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  
  // Status Colors
  status: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    connected: '#10B981',
    syncing: '#F59E0B',
    disconnected: '#EF4444',
    pcActive: '#2563EB',
    macActive: '#8B5CF6',
  },
  
  // Dark Theme
  dark: {
    text: {
      primary: '#F9FAFB',
      secondary: '#9CA3AF',
      tertiary: '#6B7280',
      inverse: '#1F2937',
    },
    background: {
      primary: '#111827',
      secondary: '#1F2937',
      tertiary: '#374151',
      overlay: 'rgba(0, 0, 0, 0.7)',
    },
    ui: {
      border: '#374151',
      borderHover: '#4B5563',
      divider: '#1F2937',
      shadow: 'rgba(0, 0, 0, 0.3)',
    },
    primary: {
      pc: '#3B82F6',
      mac: '#9333EA',
      fusion: '#6D28D9',
    },
  },
};

export const typography = {
  fontFamily: {
    display: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    body: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    mono: '"JetBrains Mono", "SF Mono", Consolas, "Courier New", monospace',
  },
  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
    '5xl': '3rem',      // 48px
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const spacing = {
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px
  md: '1rem',       // 16px
  lg: '1.5rem',     // 24px
  xl: '2rem',       // 32px
  '2xl': '3rem',    // 48px
  '3xl': '4rem',    // 64px
  '4xl': '6rem',    // 96px
  '5xl': '8rem',    // 128px
};

export const borderRadius = {
  none: '0px',
  sm: '4px',
  base: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  full: '9999px',
};

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  none: 'none',
};

export const animation = {
  duration: {
    fast: '150ms',
    base: '200ms',
    slow: '400ms',
    slower: '600ms',
  },
  easing: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
};

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  notification: 1080,
};

// Platform-specific configurations
export const platformStyles = {
  windows: {
    borderRadius: borderRadius.sm,
    fontFamily: '"Segoe UI", ' + typography.fontFamily.body,
    primaryColor: colors.primary.pc,
  },
  macos: {
    borderRadius: borderRadius.md,
    fontFamily: '-apple-system, BlinkMacSystemFont, ' + typography.fontFamily.body,
    primaryColor: colors.primary.mac,
  },
  universal: {
    borderRadius: borderRadius.base,
    fontFamily: typography.fontFamily.body,
    primaryColor: colors.primary.fusion,
  },
};

// Component presets
export const components = {
  button: {
    primary: {
      background: colors.gradient.fusion,
      color: colors.text.inverse,
      borderRadius: borderRadius.base,
      padding: `${spacing.sm} ${spacing.lg}`,
      fontWeight: typography.fontWeight.semibold,
      transition: `all ${animation.duration.base} ${animation.easing.inOut}`,
      hover: {
        background: colors.gradient.fusionHover,
        transform: 'translateY(-1px)',
        boxShadow: shadows.md,
      },
    },
    secondary: {
      background: colors.background.secondary,
      color: colors.text.primary,
      border: `1px solid ${colors.ui.border}`,
      borderRadius: borderRadius.base,
      padding: `${spacing.sm} ${spacing.lg}`,
      transition: `all ${animation.duration.base} ${animation.easing.inOut}`,
      hover: {
        borderColor: colors.ui.borderHover,
        background: colors.background.tertiary,
      },
    },
  },
  card: {
    background: colors.background.primary,
    borderRadius: borderRadius.md,
    border: `1px solid ${colors.ui.border}`,
    padding: spacing.lg,
    boxShadow: shadows.sm,
    transition: `all ${animation.duration.base} ${animation.easing.inOut}`,
    hover: {
      boxShadow: shadows.md,
      borderColor: colors.primary.fusion,
    },
  },
  input: {
    background: colors.background.primary,
    border: `1px solid ${colors.ui.border}`,
    borderRadius: borderRadius.base,
    padding: `${spacing.sm} ${spacing.md}`,
    fontSize: typography.fontSize.base,
    transition: `all ${animation.duration.fast} ${animation.easing.inOut}`,
    focus: {
      borderColor: colors.primary.fusion,
      boxShadow: `0 0 0 3px ${colors.gradient.fusionSubtle}`,
      outline: 'none',
    },
  },
};

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animation,
  breakpoints,
  zIndex,
  platformStyles,
  components,
};
