'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { PlanSummary } from '@/lib/types/itinerary';

interface DashboardClientProps {
  initialPlans: PlanSummary[];
}

export function DashboardClient({ initialPlans }: DashboardClientProps) {
  const [plans, setPlans] = useState(initialPlans);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this itinerary? This action cannot be undone.')) {
      return;
    }

    setDeleting(id);
    try {
      const response = await fetch(`/api/plans/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');
      setPlans(plans.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting plan:', error);
      alert('Failed to delete itinerary. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      <div className="header">
        <h1>My Itineraries</h1>
        <p>View and manage your travel plans</p>
        <Link href="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>
          + Create New Itinerary
        </Link>
      </div>

      <div className="container" style={{ padding: '2rem 1rem' }}>
        {plans.length === 0 ? (
          <div className="day-card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
              No itineraries yet!
            </p>
            <p style={{ color: 'var(--ghibli-grey)', marginBottom: '1.5rem' }}>
              Create your first travel itinerary to get started.
            </p>
            <Link href="/" className="btn btn-primary">
              Create Your First Itinerary
            </Link>
          </div>
        ) : (
          <div className="plans-grid">
            {plans.map(plan => (
              <div key={plan.id} className="day-card plan-card">
                <h3>{plan.destination}</h3>
                <p style={{ color: 'var(--ghibli-forest)', fontWeight: 500 }}>
                  {plan.numDays} {plan.numDays === 1 ? 'day' : 'days'}
                </p>
                <p className="text-muted">
                  Created {formatDate(plan.createdAt)}
                </p>
                <div className="plan-actions">
                  <Link href={`/plan/${plan.id}`} className="btn btn-primary" style={{ flex: 1, textAlign: 'center' }}>
                    View
                  </Link>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(plan.id)}
                    disabled={deleting === plan.id}
                  >
                    {deleting === plan.id ? '...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
