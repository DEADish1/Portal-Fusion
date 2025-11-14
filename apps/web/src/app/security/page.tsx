import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { SecurityAudit } from '@/components/security/security-audit';

export default function SecurityPage() {
  return (
    <DashboardLayout>
      <SecurityAudit />
    </DashboardLayout>
  );
}
