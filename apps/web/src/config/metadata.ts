import type { Metadata } from 'next';

export const siteMetadata: Metadata = {
  metadataBase: new URL('https://portalfusion.app'),
  title: {
    default: 'Portal Fusion - Seamless Computing, Unified',
    template: '%s | Portal Fusion',
  },
  description: 'Seamless computing, unified - Cross-platform PC to Mac application for file transfer, clipboard sync, screen sharing, and more.',
  applicationName: 'Portal Fusion',
  authors: [
    {
      name: 'Your Name',
      url: 'https://portalfusion.app',
    },
  ],
  generator: 'Next.js',
  keywords: [
    'Portal Fusion',
    'cross-platform',
    'PC to Mac',
    'file transfer',
    'clipboard sync',
    'screen share',
    'remote control',
    'unified workspace',
    'device bridge',
    'seamless computing',
    'productivity app',
    'Windows Mac integration',
  ],
  referrer: 'origin-when-cross-origin',
  creator: 'Portal Fusion Team',
  publisher: 'Portal Fusion',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#6366F1' },
    { media: '(prefers-color-scheme: dark)', color: '#2563EB' },
  ],
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/assets/portal-fusion-icon.svg', type: 'image/svg+xml' },
      { url: '/assets/icons/icon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/assets/icons/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/assets/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/assets/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/assets/portal-fusion-mono.svg',
        color: '#6366F1',
      },
    ],
  },
  openGraph: {
    type: 'website',
    siteName: 'Portal Fusion',
    title: 'Portal Fusion - Seamless Computing, Unified',
    description: 'Cross-platform PC to Mac application for seamless file transfer, clipboard sync, and screen sharing.',
    url: 'https://portalfusion.app',
    locale: 'en_US',
    images: [
      {
        url: '/assets/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Portal Fusion - Where platforms converge, productivity emerges',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@portalfusion',
    creator: '@portalfusion',
    title: 'Portal Fusion',
    description: 'Seamless computing, unified - Cross-platform PC to Mac application',
    images: ['/assets/twitter-card.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: 'technology',
  classification: 'Software Application',
  alternates: {
    canonical: 'https://portalfusion.app',
    languages: {
      'en-US': 'https://portalfusion.app/en-US',
    },
    types: {
      'application/rss+xml': 'https://portalfusion.app/feed.xml',
    },
  },
  bookmarks: [
    'https://portalfusion.app',
  ],
  other: {
    'msapplication-TileColor': '#6366F1',
    'msapplication-TileImage': '/assets/icons/mstile-144x144.png',
    'msapplication-config': '/browserconfig.xml',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Portal Fusion',
    'mobile-web-app-capable': 'yes',
  },
};

export default siteMetadata;
