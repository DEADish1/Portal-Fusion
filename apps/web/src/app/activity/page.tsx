import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ActivityLog } from '@/components/activity/activity-log';

export default function ActivityPage() {
  return (
    <DashboardLayout>
      <ActivityLog />
    </DashboardLayout>
  );
}
