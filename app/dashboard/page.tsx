import { getPlanSummaries } from '@/lib/db/queries';
import { DashboardClient } from './DashboardClient';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const plans = await getPlanSummaries();
  return <DashboardClient initialPlans={plans} />;
}

export const metadata = {
  title: 'My Itineraries - Travel Planner',
};
