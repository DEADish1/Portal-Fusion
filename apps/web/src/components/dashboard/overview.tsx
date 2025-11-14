'use client';

import { useDashboardStore } from '@/store/dashboard-store';
import { MetricsCards } from './metrics-cards';
import { DevicesList } from './devices-list';
import { RecentActivity } from './recent-activity';

export function DashboardOverview() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Monitor your connected devices and activity
        </p>
      </div>

      <MetricsCards />

      <div className="grid gap-6 lg:grid-cols-2">
        <DevicesList />
        <RecentActivity />
      </div>
    </div>
  );
}
