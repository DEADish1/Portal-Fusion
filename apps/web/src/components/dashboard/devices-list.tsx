'use client';

import { useDashboardStore } from '@/store/dashboard-store';
import { getDeviceIcon } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

export function DevicesList() {
  const devices = useDashboardStore((state) => state.devices);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <Wifi className="h-4 w-4 text-green-500" />;
      case 'offline':
        return <WifiOff className="h-4 w-4 text-gray-400" />;
      case 'connecting':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'offline':
        return 'bg-gray-400';
      case 'connecting':
        return 'bg-blue-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm">
      <div className="border-b border-border p-6">
        <h3 className="text-lg font-semibold">Connected Devices</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {devices.length} device{devices.length !== 1 ? 's' : ''} registered
        </p>
      </div>

      <div className="p-6">
        {devices.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📱</div>
            <p className="text-muted-foreground">No devices connected yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Install Portal Fusion on your other devices to get started
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {devices.map((device) => (
              <div
                key={device.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{getDeviceIcon(device.platform)}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{device.name}</h4>
                      <div className={`h-2 w-2 rounded-full ${getStatusColor(device.status)}`} />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {device.platform} • {device.ipAddress || 'No IP'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Last seen {formatDistanceToNow(device.lastSeen, { addSuffix: true })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getStatusIcon(device.status)}
                  <span className="text-sm capitalize text-muted-foreground">
                    {device.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
