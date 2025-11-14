import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { SettingsPanel } from '@/components/settings/settings-panel';

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <SettingsPanel />
    </DashboardLayout>
  );
}
