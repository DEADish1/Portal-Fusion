// Portal Fusion UI Library
// Export all components, theme, and styles

// Theme configuration
export { default as theme } from './theme';
export * from './theme';

// Import global styles (consumers should import this in their app)
import './globals.css';

// Export all Portal Fusion components
export * from './components/PortalFusionComponents';

// Re-export specific components for easier access
export {
  ConnectionStatus,
  DeviceCard,
  PortalButton,
  PortalLogo,
  PortalSpinner,
  GradientHeading,
  PlatformSwitcher,
  TransferProgress,
  ConnectionFlow,
  FeatureCard,
  PortalFusionDemo,
} from './components/PortalFusionComponents';

// Export CSS class name utilities for use with clsx/classnames
export const pfClasses = {
  // Gradients
  gradient: 'bg-pf-gradient',
  gradientHorizontal: 'bg-pf-gradient-horizontal',
  gradientText: 'text-gradient-pf',
  gradientBorder: 'gradient-border-pf',
  
  // Platform specific
  pc: 'platform-pc',
  mac: 'platform-mac',
  fusion: 'platform-fusion',
  
  // Components
  button: 'btn-pf',
  card: 'card-pf',
  loading: 'loading-pf',
  
  // Animations
  portalMerge: 'animate-portal-merge',
  portalRotate: 'animate-portal-rotate',
  portalPulse: 'animate-portal-pulse',
  gradientShift: 'animate-gradient-shift',
  connectionFlow: 'animate-connection-flow',
  
  // Status
  connected: 'status-connected',
  syncing: 'status-syncing',
  disconnected: 'status-disconnected',
};

// Export color tokens for JavaScript usage
export const colors = {
  pc: {
    primary: '#2563EB',
    light: '#60A5FA',
    dark: '#1E40AF',
  },
  mac: {
    primary: '#8B5CF6',
    light: '#A78BFA',
    dark: '#7C3AED',
  },
  fusion: {
    primary: '#6366F1',
    light: '#818CF8',
    dark: '#5B21B6',
  },
  gradient: {
    default: 'linear-gradient(135deg, #2563EB 0%, #6366F1 50%, #8B5CF6 100%)',
    horizontal: 'linear-gradient(90deg, #2563EB 0%, #8B5CF6 100%)',
    vertical: 'linear-gradient(180deg, #2563EB 0%, #8B5CF6 100%)',
    radial: 'radial-gradient(circle, #6366F1 0%, #2563EB 50%, #8B5CF6 100%)',
  },
};

// Export utility function to generate gradient with custom colors
export const createPortalGradient = (
  startColor: string = colors.pc.primary,
  middleColor: string = colors.fusion.primary,
  endColor: string = colors.mac.primary,
  angle: number = 135
): string => {
  return `linear-gradient(${angle}deg, ${startColor} 0%, ${middleColor} 50%, ${endColor} 100%)`;
};

// Export platform detection utility
export const getPlatformColor = (platform: 'pc' | 'mac' | 'fusion' | 'both'): string => {
  switch (platform) {
    case 'pc':
      return colors.pc.primary;
    case 'mac':
      return colors.mac.primary;
    case 'fusion':
    case 'both':
      return colors.fusion.primary;
    default:
      return colors.fusion.primary;
  }
};

// Export animation duration constants
export const animations = {
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '400ms',
    slower: '600ms',
  },
  easing: {
    default: 'ease-in-out',
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
};

// Type definitions for theme usage
export type PlatformType = 'pc' | 'mac' | 'fusion' | 'both';
export type StatusType = 'connected' | 'syncing' | 'disconnected';
export type ButtonVariant = 'primary' | 'secondary' | 'gradient';
export type SizeVariant = 'sm' | 'md' | 'lg';

// Export default theme object
export default {
  colors,
  animations,
  classes: pfClasses,
  utils: {
    createPortalGradient,
    getPlatformColor,
  },
};
