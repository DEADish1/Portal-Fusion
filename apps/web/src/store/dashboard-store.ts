import { create } from 'zustand';

export interface Device {
  id: string;
  name: string;
  platform: string;
  status: 'online' | 'offline' | 'connecting';
  lastSeen: Date;
  ipAddress?: string;
  features: {
    clipboard: boolean;
    fileTransfer: boolean;
    screenShare: boolean;
    kvm: boolean;
    audio: boolean;
    camera: boolean;
    browser: boolean;
    password: boolean;
  };
}

export interface ActivityLog {
  id: string;
  type: 'clipboard' | 'file-transfer' | 'screen-share' | 'notification' | 'browser' | 'password' | 'kvm' | 'audio' | 'camera';
  action: string;
  deviceId: string;
  deviceName: string;
  timestamp: Date;
  details?: Record<string, unknown>;
  status: 'success' | 'error' | 'pending';
}

export interface DashboardMetrics {
  totalDevices: number;
  activeConnections: number;
  bytesTransferred: number;
  clipboardSyncs: number;
  fileTransfers: number;
  notifications: number;
}

interface DashboardState {
  devices: Device[];
  activityLogs: ActivityLog[];
  metrics: DashboardMetrics;
  selectedDevice: Device | null;

  // Actions
  addDevice: (device: Device) => void;
  removeDevice: (deviceId: string) => void;
  updateDevice: (deviceId: string, updates: Partial<Device>) => void;
  setSelectedDevice: (device: Device | null) => void;
  addActivityLog: (log: ActivityLog) => void;
  updateMetrics: (metrics: Partial<DashboardMetrics>) => void;
  clearActivityLogs: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  devices: [],
  activityLogs: [],
  metrics: {
    totalDevices: 0,
    activeConnections: 0,
    bytesTransferred: 0,
    clipboardSyncs: 0,
    fileTransfers: 0,
    notifications: 0,
  },
  selectedDevice: null,

  addDevice: (device) =>
    set((state) => ({
      devices: [...state.devices, device],
      metrics: { ...state.metrics, totalDevices: state.devices.length + 1 },
    })),

  removeDevice: (deviceId) =>
    set((state) => ({
      devices: state.devices.filter((d) => d.id !== deviceId),
      metrics: { ...state.metrics, totalDevices: state.devices.length - 1 },
    })),

  updateDevice: (deviceId, updates) =>
    set((state) => ({
      devices: state.devices.map((d) => (d.id === deviceId ? { ...d, ...updates } : d)),
    })),

  setSelectedDevice: (device) => set({ selectedDevice: device }),

  addActivityLog: (log) =>
    set((state) => ({
      activityLogs: [log, ...state.activityLogs].slice(0, 100), // Keep last 100 logs
    })),

  updateMetrics: (metrics) =>
    set((state) => ({
      metrics: { ...state.metrics, ...metrics },
    })),

  clearActivityLogs: () => set({ activityLogs: [] }),
}));
