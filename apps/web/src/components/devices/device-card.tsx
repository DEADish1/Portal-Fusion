'use client';

import { Device } from '@/store/dashboard-store';
import { getDeviceIcon } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface DeviceCardProps {
  device: Device;
  selected: boolean;
  onClick: () => void;
}

export function DeviceCard({ device, selected, onClick }: DeviceCardProps) {
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
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-4 rounded-lg border transition-all',
        selected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border bg-card hover:bg-accent/50'
      )}
    >
      <div className="flex items-center gap-3">
        <div className="text-3xl">{getDeviceIcon(device.platform)}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium truncate">{device.name}</h4>
            <div className={`h-2 w-2 rounded-full ${getStatusColor(device.status)}`} />
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {device.platform}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(device.lastSeen, { addSuffix: true })}
          </p>
        </div>
      </div>
    </button>
  );
}
