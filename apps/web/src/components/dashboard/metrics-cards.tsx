'use client';

import { useDashboardStore } from '@/store/dashboard-store';
import { formatBytes } from '@/lib/utils';
import { Laptop2, Zap, HardDrive, Copy, FileText, Bell } from 'lucide-react';

export function MetricsCards() {
  const metrics = useDashboardStore((state) => state.metrics);

  const cards = [
    {
      title: 'Total Devices',
      value: metrics.totalDevices,
      icon: Laptop2,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      title: 'Active Connections',
      value: metrics.activeConnections,
      icon: Zap,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
    },
    {
      title: 'Data Transferred',
      value: formatBytes(metrics.bytesTransferred),
      icon: HardDrive,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
    {
      title: 'Clipboard Syncs',
      value: metrics.clipboardSyncs,
      icon: Copy,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
    },
    {
      title: 'File Transfers',
      value: metrics.fileTransfers,
      icon: FileText,
      color: 'text-cyan-500',
      bg: 'bg-cyan-500/10',
    },
    {
      title: 'Notifications',
      value: metrics.notifications,
      icon: Bell,
      color: 'text-pink-500',
      bg: 'bg-pink-500/10',
    },
  ];

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <div
          key={card.title}
          className="rounded-lg border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className={`rounded-lg p-2 ${card.bg}`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
            <p className="mt-2 text-2xl font-bold">{card.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
