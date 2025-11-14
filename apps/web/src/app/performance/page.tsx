import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PerformanceMetrics } from '@/components/performance/performance-metrics';

export default function PerformancePage() {
  return (
    <DashboardLayout>
      <PerformanceMetrics />
    </DashboardLayout>
  );
}
