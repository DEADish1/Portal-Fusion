'use client';

import { useState } from 'react';
import { useDashboardStore } from '@/store/dashboard-store';
import { format } from 'date-fns';
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
  Search,
  Filter,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';

export function ActivityLog() {
  const activityLogs = useDashboardStore((state) => state.activityLogs);
  const clearActivityLogs = useDashboardStore((state) => state.clearActivityLogs);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

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
    return <Icon className="h-5 w-5" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-blue-500 animate-pulse" />;
      default:
        return null;
    }
  };

  const getActivityColor = (type: string) => {
    const colors: Record<string, string> = {
      clipboard: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      'file-transfer': 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
      'screen-share': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      notification: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
      browser: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      password: 'bg-green-500/10 text-green-500 border-green-500/20',
      kvm: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
      audio: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      camera: 'bg-red-500/10 text-red-500 border-red-500/20',
    };
    return colors[type] || 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  };

  const filteredLogs = activityLogs.filter((log) => {
    const matchesSearch =
      searchQuery === '' ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.deviceName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedType === 'all' || log.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || log.status === selectedStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const activityTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'clipboard', label: 'Clipboard' },
    { value: 'file-transfer', label: 'File Transfer' },
    { value: 'screen-share', label: 'Screen Share' },
    { value: 'notification', label: 'Notifications' },
    { value: 'browser', label: 'Browser' },
    { value: 'password', label: 'Password' },
    { value: 'kvm', label: 'KVM' },
    { value: 'audio', label: 'Audio' },
    { value: 'camera', label: 'Camera' },
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'success', label: 'Success' },
    { value: 'error', label: 'Error' },
    { value: 'pending', label: 'Pending' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Log</h1>
          <p className="text-muted-foreground mt-2">
            Track all activities and transfers across your devices
          </p>
        </div>

        <div className="flex gap-2">
          <button className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors">
            <Download className="h-4 w-4" />
            Export
          </button>
          <button
            onClick={clearActivityLogs}
            className="flex items-center gap-2 rounded-lg border border-destructive/50 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Clear All
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="rounded-lg border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {activityTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="rounded-lg border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {statusOptions.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </div>

      {/* Activity List */}
      <div className="rounded-lg border border-border bg-card">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-muted-foreground">
              {searchQuery || selectedType !== 'all' || selectedStatus !== 'all'
                ? 'No activities match your filters'
                : 'No activity logs yet'}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Activities from your devices will appear here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className={`rounded-lg p-3 border ${getActivityColor(log.type)}`}>
                    {getActivityIcon(log.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium truncate">{log.action}</h4>
                      {getStatusIcon(log.status)}
                    </div>

                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <span>{log.deviceName}</span>
                      <span>•</span>
                      <span>{log.type.replace('-', ' ')}</span>
                      <span>•</span>
                      <span>{format(log.timestamp, 'PPp')}</span>
                    </div>

                    {log.details && Object.keys(log.details).length > 0 && (
                      <div className="mt-3 p-3 rounded-lg bg-accent/30 text-xs">
                        <pre className="overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      {filteredLogs.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold">{filteredLogs.length}</p>
            <p className="text-sm text-muted-foreground mt-1">Total Activities</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-green-500">
              {filteredLogs.filter(l => l.status === 'success').length}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Successful</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-destructive">
              {filteredLogs.filter(l => l.status === 'error').length}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Errors</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-blue-500">
              {filteredLogs.filter(l => l.status === 'pending').length}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Pending</p>
          </div>
        </div>
      )}
    </div>
  );
}
