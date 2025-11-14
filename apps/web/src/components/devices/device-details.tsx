'use client';

import { Device } from '@/store/dashboard-store';
import { getDeviceIcon } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Wifi,
  WifiOff,
  Loader2,
  Copy,
  FileText,
  Monitor,
  Mouse,
  Volume2,
  Camera,
  Globe,
  Lock,
  Trash2,
  Power,
} from 'lucide-react';

interface DeviceDetailsProps {
  device: Device;
}

export function DeviceDetails({ device }: DeviceDetailsProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <Wifi className="h-5 w-5 text-green-500" />;
      case 'offline':
        return <WifiOff className="h-5 w-5 text-gray-400" />;
      case 'connecting':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return null;
    }
  };

  const features = [
    { name: 'Clipboard Sync', key: 'clipboard', icon: Copy },
    { name: 'File Transfer', key: 'fileTransfer', icon: FileText },
    { name: 'Screen Share', key: 'screenShare', icon: Monitor },
    { name: 'KVM Control', key: 'kvm', icon: Mouse },
    { name: 'Audio Routing', key: 'audio', icon: Volume2 },
    { name: 'Camera Sharing', key: 'camera', icon: Camera },
    { name: 'Browser Sync', key: 'browser', icon: Globe },
    { name: 'Password Manager', key: 'password', icon: Lock },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="text-5xl">{getDeviceIcon(device.platform)}</div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold">{device.name}</h2>
                {getStatusIcon(device.status)}
              </div>
              <p className="text-muted-foreground mt-1">
                {device.platform} • {device.ipAddress || 'No IP address'}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors">
              <Power className="h-4 w-4" />
              {device.status === 'online' ? 'Disconnect' : 'Connect'}
            </button>
            <button className="flex items-center gap-2 rounded-lg border border-destructive/50 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors">
              <Trash2 className="h-4 w-4" />
              Remove
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Device ID</p>
            <p className="mt-1 font-mono text-sm">{device.id}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Last Seen</p>
            <p className="mt-1 text-sm">
              {format(device.lastSeen, 'PPpp')}
            </p>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Enabled Features</h3>

        <div className="grid grid-cols-2 gap-4">
          {features.map((feature) => {
            const enabled = device.features[feature.key as keyof typeof device.features];
            return (
              <div
                key={feature.key}
                className="flex items-center justify-between p-4 rounded-lg border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${enabled ? 'bg-primary/10 text-primary' : 'bg-gray-500/10 text-gray-500'}`}>
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <span className="font-medium text-sm">{feature.name}</span>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={() => {}}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                </label>
              </div>
            );
          })}
        </div>
      </div>

      {/* Statistics */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Connection Statistics</h3>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-accent/50">
            <p className="text-2xl font-bold text-primary">0</p>
            <p className="text-sm text-muted-foreground mt-1">Files Transferred</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-accent/50">
            <p className="text-2xl font-bold text-primary">0</p>
            <p className="text-sm text-muted-foreground mt-1">Clipboard Syncs</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-accent/50">
            <p className="text-2xl font-bold text-primary">0 MB</p>
            <p className="text-sm text-muted-foreground mt-1">Data Transferred</p>
          </div>
        </div>
      </div>
    </div>
  );
}
