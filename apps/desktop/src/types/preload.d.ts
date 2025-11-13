/**
 * Type declarations for Portal Fusion Electron API
 */

interface PortalFusionAPI {
  app: {
    getVersion: () => Promise<string>;
    getPlatform: () => Promise<string>;
    getArch: () => Promise<string>;
    quit: () => Promise<void>;
    relaunch: () => Promise<void>;
  };

  window: {
    minimize: () => Promise<void>;
    maximize: () => Promise<void>;
    close: () => Promise<void>;
    show: () => Promise<void>;
    hide: () => Promise<void>;
  };

  settings: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
    getAll: () => Promise<any>;
  };

  native: {
    getClipboard: () => Promise<any>;
    setClipboard: (content: any) => Promise<void>;
    getSystemInfo: () => Promise<any>;
    getDisplays: () => Promise<any[]>;
    getSources: () => Promise<any[]>;
    lockSystem: () => Promise<void>;
    sleepSystem: () => Promise<void>;
    getBatteryInfo: () => Promise<any>;
    getNetworkInterfaces: () => Promise<any[]>;
  };

  notification: {
    show: (options: any) => Promise<string>;
    close: (id: string) => Promise<void>;
  };

  permission: {
    requestCamera: () => Promise<boolean>;
    requestMicrophone: () => Promise<boolean>;
    requestScreen: () => Promise<boolean>;
    requestAccessibility: () => Promise<boolean>;
    getAll: () => Promise<Record<string, boolean>>;
  };

  discovery: {
    start: () => Promise<void>;
    stop: () => Promise<void>;
    getLocalDevice: () => Promise<any>;
    getDevices: () => Promise<any[]>;
    refresh: () => Promise<void>;
  };

  pairing: {
    initiate: (device: any) => Promise<any>;
    join: (qrData: string, localDevice: any) => Promise<any>;
    verifyPin: (sessionId: string, pin: string) => Promise<boolean>;
    complete: (sessionId: string) => Promise<any>;
    cancel: (sessionId: string) => Promise<void>;
    getPairedDevices: () => Promise<any[]>;
    unpair: (deviceId: string) => Promise<void>;
  };

  connection: {
    connect: (device: any) => Promise<any>;
    disconnect: (deviceId: string) => Promise<void>;
    getConnections: () => Promise<any[]>;
    sendMessage: (deviceId: string, message: any) => Promise<void>;
  };

  eventbus: {
    getActivityLog: (limit?: number) => Promise<any[]>;
    clearActivityLog: () => Promise<void>;
  };

  update: {
    check: () => Promise<any>;
    download: () => Promise<void>;
    install: () => Promise<void>;
  };

  dialog: {
    open: (options: any) => Promise<any>;
    save: (options: any) => Promise<any>;
  };

  shell: {
    openExternal: (url: string) => Promise<void>;
    showItemInFolder: (path: string) => Promise<void>;
  };

  on: (channel: string, callback: (...args: any[]) => void) => void;
  off: (channel: string, callback: (...args: any[]) => void) => void;
  once: (channel: string, callback: (...args: any[]) => void) => void;
}

declare global {
  interface Window {
    portalFusion: PortalFusionAPI;
  }
}

export {};
