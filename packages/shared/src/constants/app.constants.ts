/**
 * Portal Fusion Application Constants
 * Central configuration for all app metadata, branding, and settings
 */

// ==================================================
// Application Identity
// ==================================================

export const APP_CONFIG = {
  name: 'Portal Fusion',
  displayName: 'Portal Fusion',
  shortName: 'Portal Fusion',
  description: 'Seamless computing, unified - Cross-platform PC to Mac application',
  tagline: 'Seamless computing, unified',
  slogan: 'Where platforms converge, productivity emerges',
  version: '1.0.0',
  buildNumber: '100',
  copyright: 'Copyright © 2024 Portal Fusion. All rights reserved.',
} as const;

// ==================================================
// Brand Colors
// ==================================================

export const BRAND_COLORS = {
  primary: '#2563EB',      // PC Blue
  secondary: '#8B5CF6',    // Mac Purple
  accent: '#6366F1',       // Fusion Indigo
  gradient: 'linear-gradient(135deg, #2563EB 0%, #6366F1 50%, #8B5CF6 100%)',
  gradientHorizontal: 'linear-gradient(90deg, #2563EB 0%, #8B5CF6 100%)',
  
  // Platform specific
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
  
  // UI Colors
  background: '#FFFFFF',
  backgroundAlt: '#F9FAFB',
  text: '#1F2937',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  
  // Status Colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
} as const;

// ==================================================
// Application IDs
// ==================================================

export const APP_IDS = {
  appId: 'com.portalfusion.app',
  bundleId: 'com.portalfusion',
  packageId: 'portal-fusion',
  
  // Platform specific
  windows: {
    appId: 'com.portalfusion.windows',
    publisherId: 'CN=Portal Fusion',
    packageName: 'PortalFusion',
  },
  mac: {
    appId: 'com.portalfusion.mac',
    teamId: 'YOUR_TEAM_ID',
    bundleId: 'com.portalfusion.mac',
  },
  linux: {
    appId: 'com.portalfusion.linux',
    desktopId: 'portal-fusion.desktop',
  },
  web: {
    appId: 'com.portalfusion.web',
    manifestId: 'portal-fusion-pwa',
  },
} as const;

// ==================================================
// URLs and Links
// ==================================================

export const URLS = {
  website: 'https://portalfusion.app',
  documentation: 'https://docs.portalfusion.app',
  support: 'https://support.portalfusion.app',
  api: 'https://api.portalfusion.app',
  download: 'https://download.portalfusion.app',
  
  // Store Links
  stores: {
    microsoft: 'ms-windows-store://pdp/?productid=portal-fusion',
    mac: 'https://apps.apple.com/app/portal-fusion',
    snapcraft: 'snap://portal-fusion',
  },
  
  // Social Links
  social: {
    github: 'https://github.com/yourusername/portal-fusion',
    twitter: 'https://twitter.com/portalfusion',
    discord: 'https://discord.gg/portalfusion',
    reddit: 'https://reddit.com/r/portalfusion',
    youtube: 'https://youtube.com/@portalfusion',
  },
  
  // Legal
  legal: {
    privacy: 'https://portalfusion.app/privacy',
    terms: 'https://portalfusion.app/terms',
    license: 'https://portalfusion.app/license',
    cookies: 'https://portalfusion.app/cookies',
  },
} as const;

// ==================================================
// Features Configuration
// ==================================================

export const FEATURES = {
  clipboardSync: {
    enabled: true,
    name: 'Clipboard Sync',
    description: 'Copy on one device, paste on another',
    icon: '📋',
  },
  fileTransfer: {
    enabled: true,
    name: 'File Transfer',
    description: 'Drag and drop files between devices',
    icon: '📁',
    maxFileSize: 10 * 1024 * 1024 * 1024, // 10GB
    chunkSize: 64 * 1024, // 64KB
  },
  screenShare: {
    enabled: true,
    name: 'Screen Share',
    description: 'Use your tablet as a second monitor',
    icon: '🖥️',
    maxResolution: { width: 3840, height: 2160 },
    defaultFPS: 30,
  },
  remoteControl: {
    enabled: true,
    name: 'Remote Control',
    description: 'Control one device from another',
    icon: '🎮',
  },
  notifications: {
    enabled: true,
    name: 'Notification Sync',
    description: 'Mirror notifications across devices',
    icon: '🔔',
  },
  audioRouting: {
    enabled: true,
    name: 'Audio Routing',
    description: 'Use any device speakers or microphone',
    icon: '🔊',
  },
  cameraShare: {
    enabled: true,
    name: 'Camera Share',
    description: 'Use device cameras across platforms',
    icon: '📹',
  },
  browserSync: {
    enabled: true,
    name: 'Browser Sync',
    description: 'Sync tabs, bookmarks, and passwords',
    icon: '🌐',
  },
} as const;

// ==================================================
// Platform Requirements
// ==================================================

export const REQUIREMENTS = {
  node: '>=18.0.0',
  npm: '>=10.0.0',
  electron: '>=27.0.0',
  
  platforms: {
    windows: {
      minVersion: '10',
      build: '19041', // Windows 10 version 2004
      architectures: ['x64', 'arm64'],
    },
    mac: {
      minVersion: '10.15', // macOS Catalina
      architectures: ['x64', 'arm64'],
    },
    linux: {
      distributions: ['ubuntu', 'debian', 'fedora', 'arch'],
      architectures: ['x64', 'arm64'],
    },
  },
} as const;

// ==================================================
// Network Configuration
// ==================================================

export const NETWORK = {
  defaultPort: 7777,
  discoveryPort: 7778,
  webrtcPort: 7779,
  wsPort: 7780,
  
  protocols: {
    discovery: '_portalfusion._tcp',
    webrtc: 'webrtc',
    websocket: 'ws',
  },
  
  encryption: {
    algorithm: 'AES-256-GCM',
    keyExchange: 'ECDH',
    hash: 'SHA-256',
  },
  
  timeout: {
    connection: 30000, // 30s
    heartbeat: 5000,   // 5s
    discovery: 10000,  // 10s
    transfer: 60000,   // 60s
  },
} as const;

// ==================================================
// Storage Keys
// ==================================================

export const STORAGE_KEYS = {
  settings: 'portal-fusion-settings',
  theme: 'portal-fusion-theme',
  devices: 'portal-fusion-devices',
  session: 'portal-fusion-session',
  user: 'portal-fusion-user',
  preferences: 'portal-fusion-preferences',
  history: 'portal-fusion-history',
} as const;

// ==================================================
// Analytics & Telemetry
// ==================================================

export const ANALYTICS = {
  enabled: process.env.NODE_ENV === 'production',
  googleAnalyticsId: 'G-XXXXXXXXXX',
  mixpanelToken: 'YOUR_MIXPANEL_TOKEN',
  sentryDsn: 'YOUR_SENTRY_DSN',
  
  events: {
    APP_LAUNCHED: 'app_launched',
    DEVICE_CONNECTED: 'device_connected',
    FILE_TRANSFERRED: 'file_transferred',
    CLIPBOARD_SYNCED: 'clipboard_synced',
    SCREEN_SHARED: 'screen_shared',
    ERROR_OCCURRED: 'error_occurred',
  },
} as const;

// ==================================================
// Keyboard Shortcuts
// ==================================================

export const SHORTCUTS = {
  connect: 'CommandOrControl+Shift+C',
  disconnect: 'CommandOrControl+Shift+D',
  transfer: 'CommandOrControl+Shift+T',
  clipboard: 'CommandOrControl+Shift+V',
  screen: 'CommandOrControl+Shift+S',
  settings: 'CommandOrControl+,',
  quit: 'CommandOrControl+Q',
  minimize: 'CommandOrControl+M',
  toggleDevTools: 'F12',
} as const;

// ==================================================
// File Types
// ==================================================

export const FILE_TYPES = {
  session: {
    extension: '.pfs',
    mimeType: 'application/x-portal-fusion-session',
    description: 'Portal Fusion Session File',
  },
  config: {
    extension: '.pfconfig',
    mimeType: 'application/x-portal-fusion-config',
    description: 'Portal Fusion Configuration',
  },
} as const;

// ==================================================
// Author & Team
// ==================================================

export const AUTHOR = {
  name: 'Your Name',
  email: 'contact@portalfusion.app',
  website: 'https://portalfusion.app',
  company: 'Portal Fusion Team',
} as const;

// ==================================================
// Export All Constants
// ==================================================

export default {
  APP_CONFIG,
  BRAND_COLORS,
  APP_IDS,
  URLS,
  FEATURES,
  REQUIREMENTS,
  NETWORK,
  STORAGE_KEYS,
  ANALYTICS,
  SHORTCUTS,
  FILE_TYPES,
  AUTHOR,
} as const;
