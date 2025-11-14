'use client';

import { useDashboardStore } from '@/store/dashboard-store';
import { formatDistanceToNow } from 'date-fns';
import {
  Copy,
  FileText,
  Monitor,
  Bell,
  Globe,
  Lock,
  Mouse,
  Volume2,
  Camera,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export function RecentActivity() {
  const activityLogs = useDashboardStore((state) => state.activityLogs);

  const getActivityIcon = (type: string) => {
    const icons: Record<string, any> = {
      clipboard: Copy,
      'file-transfer': FileText,
      'screen-share': Monitor,
      notification: Bell,
      browser: Globe,
      password: Lock,
      kvm: Mouse,
      audio: Volume2,
      camera: Camera,
    };
    const Icon = icons[type] || FileText;
    return <Icon className="h-4 w-4" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getActivityColor = (type: string) => {
    const colors: Record<string, string> = {
      clipboard: 'bg-orange-500/10 text-orange-500',
      'file-transfer': 'bg-cyan-500/10 text-cyan-500',
      'screen-share': 'bg-purple-500/10 text-purple-500',
      notification: 'bg-pink-500/10 text-pink-500',
      browser: 'bg-blue-500/10 text-blue-500',
      password: 'bg-green-500/10 text-green-500',
      kvm: 'bg-indigo-500/10 text-indigo-500',
      audio: 'bg-yellow-500/10 text-yellow-500',
      camera: 'bg-red-500/10 text-red-500',
    };
    return colors[type] || 'bg-gray-500/10 text-gray-500';
  };

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm">
      <div className="border-b border-border p-6">
        <h3 className="text-lg font-semibold">Recent Activity</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Latest actions across your devices
        </p>
      </div>

      <div className="p-6">
        {activityLogs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📊</div>
            <p className="text-muted-foreground">No activity yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Activity from your devices will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {activityLogs.slice(0, 20).map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-4 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
              >
                <div className={`rounded-lg p-2 ${getActivityColor(log.type)}`}>
                  {getActivityIcon(log.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{log.action}</p>
                    {getStatusIcon(log.status)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {log.deviceName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(log.timestamp, { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
