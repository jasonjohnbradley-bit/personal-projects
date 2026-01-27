import { notFound } from 'next/navigation';
import { getPlanById } from '@/lib/db/queries';
import { PlanClient } from './PlanClient';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PlanPage({ params }: Props) {
  const { id } = await params;
  const plan = await getPlanById(id);

  if (!plan) {
    notFound();
  }

  return <PlanClient plan={plan} />;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const plan = await getPlanById(id);

  if (!plan) {
    return { title: 'Plan Not Found' };
  }

  return {
    title: `${plan.destination} ${plan.numDays}-Day Itinerary`,
    description: `Interactive travel itinerary for ${plan.destination}`,
  };
}
