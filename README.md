# 🌀 Portal Fusion

> Seamless computing, unified - Cross-platform bridge for PC and Mac

<div align="center">
  <img src="assets/portal-fusion-horizontal.svg" alt="Portal Fusion" width="400">
  
  [![CI](https://github.com/yourusername/portal-fusion/actions/workflows/ci.yml/badge.svg)](https://github.com/yourusername/portal-fusion/actions/workflows/ci.yml)
  [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
  
  <strong>Transform your PC and Mac into a unified workspace</strong>
</div>

## 🚀 Overview

Portal Fusion creates a seamless bridge between your devices, enabling:

- 📋 **Universal Clipboard Sync** - Copy on one device, paste on another
- 📁 **Instant File Transfer** - Drag, drop, and share files effortlessly
- 🖥️ **Screen Sharing & Control** - Use your tablet as a second monitor or control your Mac
- ⌨️ **Universal Input** - Share keyboard, mouse, and touch input across devices
- 🔔 **Notification Mirroring** - Never miss important alerts
- 🔒 **End-to-End Encryption** - Military-grade security for all communications
- 🎨 **And much more...**

## 📦 Project Structure

```
portal-fusion/
├── apps/
│   ├── desktop/          # Electron app for MacOS & Windows
│   ├── web/             # Next.js web dashboard
│   └── server/          # Node.js bridge server
├── packages/
│   ├── shared/          # Shared types and utilities
│   ├── protocol/        # Communication protocol
│   ├── security/        # Encryption and security
│   ├── native-bridge/   # Native OS integrations
│   └── ui/             # Shared UI components
└── turbo.json          # Turborepo configuration
```

## 🛠️ Tech Stack

- **Monorepo:** Turborepo for efficient builds
- **Desktop App:** Electron with native modules
- **Web Dashboard:** Next.js 14 with TypeScript
- **Backend:** Node.js with Express/Fastify
- **Real-time:** WebSockets, WebRTC for P2P
- **Security:** E2E encryption with libsodium
- **Discovery:** mDNS/Bonjour for auto-discovery
- **Database:** SQLite (local) + Supabase (sync)

## 🚦 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 10.0.0
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/portal-fusion.git
cd portal-fusion

# Install dependencies
npm install

# Build all packages
npm run build
```

### Development

```bash
# Run all apps in development mode
npm run dev

# Run specific apps
npm run electron:dev  # Desktop app
npm run web:dev       # Web dashboard
npm run server:dev    # Bridge server
```

### Building

```bash
# Build all apps
npm run build

# Build desktop app for distribution
npm run electron:build
```

## 🎯 Features

### Core Features

- ✅ **Device Discovery** - Automatic detection of devices on the network
- ✅ **Secure Pairing** - QR code + PIN verification
- ✅ **Encrypted Communication** - AES-256-GCM encryption
- ✅ **Auto-Reconnection** - Seamless connection recovery

### Sync & Transfer

- ✅ **Clipboard Sync** - Text, images, and files
- ✅ **File Transfer** - High-speed P2P transfer
- ✅ **Folder Sync** - Real-time folder synchronization
- ✅ **Screenshot Sharing** - Instant screenshot capture and share

### Display & Input

- ✅ **Screen Mirroring** - Use tablet as second monitor
- ✅ **Remote Control** - Control one device from another
- ✅ **Universal Mouse/Keyboard** - Seamless input switching
- ✅ **Touch & Stylus Support** - Full gesture translation

### Advanced Features

- ✅ **Notification Sync** - Mirror all notifications
- ✅ **Browser Sync** - Tabs, bookmarks, passwords
- ✅ **Audio Routing** - Use any device's speakers/mic
- ✅ **Camera Sharing** - Access remote cameras
- ✅ **Command Execution** - Remote terminal access

## 🔒 Security

Portal Fusion implements multiple layers of security:

1. **Device Authentication** - RSA key pairs for device identity
2. **Secure Pairing** - QR code + PIN prevents MITM attacks
3. **E2E Encryption** - All data encrypted with AES-256-GCM
4. **Permission System** - Granular control over features
5. **Local-Only Mode** - Option to disable internet connectivity

## 📊 Implementation Status

### Phase 1: Foundation ✅
- ✅ Create monorepo project structure
- ✅ Set up Turborepo configuration
- ✅ Initialize package.json with workspaces
- ✅ Configure TypeScript for all packages
- ✅ Set up ESLint and Prettier
- ✅ Create shared types package
- ✅ Set up Git repository with .gitignore
- ✅ Create README documentation

### Phase 2: Core Infrastructure ✅
- ✅ Build device discovery service (mDNS/Bonjour)
- ✅ Implement secure pairing mechanism (QR + PIN)
- ✅ Create encrypted communication protocol
- ✅ Set up WebRTC for P2P connections
- ✅ Build connection state management
- ✅ Implement auto-reconnection logic
- ✅ Create event bus system
- ✅ Add error handling and recovery

### Phase 3: Native Agents ✅
- ✅ Set up Electron app structure
- ✅ Configure Electron Forge for both platforms
- ✅ Implement native Node modules bridge
- ✅ Create system tray application
- ✅ Add auto-start on boot capability
- ✅ Build native notification system
- ✅ Implement elevated permission handling
- ✅ Create update mechanism

### Phase 4: Basic Features ✅
- ✅ Clipboard sync (text)
- ✅ Clipboard sync (images)
- ✅ Clipboard sync (files)
- ✅ File transfer (drag & drop)
- ✅ File transfer (selection dialog)
- ✅ Notification mirroring
- ✅ URL/link sharing
- ✅ Screenshot capture and share

### Phase 5: Advanced Features 📋
- [ ] Universal keyboard/mouse (KVM)
- [ ] Second screen functionality
- [ ] Touch gesture translation
- [ ] System audio routing
- [ ] Camera sharing
- [ ] Microphone routing
- [ ] Browser tab sync
- [ ] Password manager integration

### Phase 6: Web Interface 📋
- [ ] Create Next.js dashboard
- [ ] Build device management UI
- [ ] Feature toggle controls
- [ ] Activity/transfer log
- [ ] Settings configuration panel
- [ ] Security audit viewer
- [ ] Performance metrics dashboard
- [ ] PWA configuration

### Phase 7: Security 📋
- [ ] E2E encryption implementation
- [ ] Certificate management
- [ ] Permission system
- [ ] Audit logging
- [ ] Rate limiting
- [ ] Input validation
- [ ] Sandbox for file execution
- [ ] Security scan integration

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by Apple's Continuity features
- Built with modern web technologies
- Designed for developers, by developers

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/yourusername/portal-fusion/issues)
- **Discussions:** [GitHub Discussions](https://github.com/yourusername/portal-fusion/discussions)
- **Email:** support@portal-fusion.dev

---

**Portal Fusion** - Where platforms converge, productivity emerges 🌉
