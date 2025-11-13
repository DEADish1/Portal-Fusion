import { contextBridge, ipcRenderer } from 'electron';

/**
 * Preload script - exposes safe APIs to renderer process
 * This runs in a separate context with limited privileges
 */

// API object exposed to renderer
const api = {
  // App control
  app: {
    getVersion: () => ipcRenderer.invoke('app:get-version'),
    getPlatform: () => ipcRenderer.invoke('app:get-platform'),
    getArch: () => ipcRenderer.invoke('app:get-arch'),
    quit: () => ipcRenderer.invoke('app:quit'),
    relaunch: () => ipcRenderer.invoke('app:relaunch'),
  },

  // Window control
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    show: () => ipcRenderer.invoke('window:show'),
    hide: () => ipcRenderer.invoke('window:hide'),
  },

  // Settings
  settings: {
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: any) => ipcRenderer.invoke('settings:set', key, value),
    getAll: () => ipcRenderer.invoke('settings:getAll'),
  },

  // Native bridge
  native: {
    getClipboard: () => ipcRenderer.invoke('native:getClipboard'),
    setClipboard: (content: any) => ipcRenderer.invoke('native:setClipboard', content),
    getSystemInfo: () => ipcRenderer.invoke('native:getSystemInfo'),
    getDisplays: () => ipcRenderer.invoke('native:getDisplays'),
    getSources: () => ipcRenderer.invoke('native:getSources'),
    lockSystem: () => ipcRenderer.invoke('native:lockSystem'),
    sleepSystem: () => ipcRenderer.invoke('native:sleepSystem'),
    getBatteryInfo: () => ipcRenderer.invoke('native:getBatteryInfo'),
    getNetworkInterfaces: () => ipcRenderer.invoke('native:getNetworkInterfaces'),
  },

  // Notifications
  notification: {
    show: (options: any) => ipcRenderer.invoke('notification:show', options),
    close: (id: string) => ipcRenderer.invoke('notification:close', id),
  },

  // Permissions
  permission: {
    requestCamera: () => ipcRenderer.invoke('permission:requestCamera'),
    requestMicrophone: () => ipcRenderer.invoke('permission:requestMicrophone'),
    requestScreen: () => ipcRenderer.invoke('permission:requestScreen'),
    requestAccessibility: () => ipcRenderer.invoke('permission:requestAccessibility'),
    getAll: () => ipcRenderer.invoke('permission:getAll'),
  },

  // Discovery
  discovery: {
    start: () => ipcRenderer.invoke('discovery:start'),
    stop: () => ipcRenderer.invoke('discovery:stop'),
    getLocalDevice: () => ipcRenderer.invoke('discovery:getLocalDevice'),
    getDevices: () => ipcRenderer.invoke('discovery:getDevices'),
    refresh: () => ipcRenderer.invoke('discovery:refresh'),
  },

  // Pairing
  pairing: {
    initiate: (device: any) => ipcRenderer.invoke('pairing:initiate', device),
    join: (qrData: string, localDevice: any) => ipcRenderer.invoke('pairing:join', qrData, localDevice),
    verifyPin: (sessionId: string, pin: string) => ipcRenderer.invoke('pairing:verifyPin', sessionId, pin),
    complete: (sessionId: string) => ipcRenderer.invoke('pairing:complete', sessionId),
    cancel: (sessionId: string) => ipcRenderer.invoke('pairing:cancel', sessionId),
    getPairedDevices: () => ipcRenderer.invoke('pairing:getPairedDevices'),
    unpair: (deviceId: string) => ipcRenderer.invoke('pairing:unpair', deviceId),
  },

  // Connection
  connection: {
    connect: (device: any) => ipcRenderer.invoke('connection:connect', device),
    disconnect: (deviceId: string) => ipcRenderer.invoke('connection:disconnect', deviceId),
    getConnections: () => ipcRenderer.invoke('connection:getConnections'),
    sendMessage: (deviceId: string, message: any) => ipcRenderer.invoke('connection:sendMessage', deviceId, message),
  },

  // Event bus
  eventbus: {
    getActivityLog: (limit?: number) => ipcRenderer.invoke('eventbus:getActivityLog', limit),
    clearActivityLog: () => ipcRenderer.invoke('eventbus:clearActivityLog'),
  },

  // Update
  update: {
    check: () => ipcRenderer.invoke('update:check'),
    download: () => ipcRenderer.invoke('update:download'),
    install: () => ipcRenderer.invoke('update:install'),
  },

  // Dialog
  dialog: {
    open: (options: any) => ipcRenderer.invoke('dialog:open', options),
    save: (options: any) => ipcRenderer.invoke('dialog:save', options),
  },

  // Shell
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),
    showItemInFolder: (path: string) => ipcRenderer.invoke('shell:showItemInFolder', path),
  },

  // Event listeners
  on: (channel: string, callback: (...args: any[]) => void) => {
    // Whitelist channels that can be subscribed to
    const validChannels = [
      'device:discovered',
      'device:connected',
      'device:disconnected',
      'device:paired',
      'message:received',
      'message:sent',
      'file:transfer:start',
      'file:transfer:progress',
      'file:transfer:complete',
      'clipboard:changed',
      'screen:share:start',
      'screen:share:stop',
      'error',
      'warning',
      'activity',
      'navigate',
    ];

    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  },

  off: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.removeListener(channel, callback);
  },

  once: (channel: string, callback: (...args: any[]) => void) => {
    const validChannels = [
      'device:discovered',
      'device:connected',
      'device:disconnected',
      'device:paired',
      'message:received',
      'message:sent',
      'file:transfer:start',
      'file:transfer:progress',
      'file:transfer:complete',
      'clipboard:changed',
      'screen:share:start',
      'screen:share:stop',
      'error',
      'warning',
      'activity',
      'navigate',
    ];

    if (validChannels.includes(channel)) {
      ipcRenderer.once(channel, (event, ...args) => callback(...args));
    }
  },
};

// Expose API to renderer
contextBridge.exposeInMainWorld('portalFusion', api);

// Type declarations for TypeScript (will be in a separate .d.ts file)
export type PortalFusionAPI = typeof api;
