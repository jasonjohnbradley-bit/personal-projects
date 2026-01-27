'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileUpload } from '@/components/ui/FileUpload';

const loadingSteps = [
  { text: 'Researching destinations...', duration: 10000 },
  { text: 'Planning activities...', duration: 15000 },
  { text: 'Finding the best restaurants...', duration: 15000 },
  { text: 'Finalizing your itinerary...', duration: 0 },
];

const cuisineOptions = [
  'Japanese', 'Italian', 'French', 'Chinese', 'Thai',
  'Mexican', 'Indian', 'Korean', 'Mediterranean', 'American'
];

const culturalOptions = [
  'Museums', 'Temples/Shrines', 'Historical Sites', 'Art Galleries',
  'Local Markets', 'Architecture', 'Gardens/Parks', 'Festivals'
];

const shoppingOptions = [
  'Local Crafts', 'Fashion', 'Electronics', 'Food/Souvenirs',
  'Vintage/Antiques', 'Bookstores', 'Department Stores'
];

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [formData, setFormData] = useState({
    destination: '',
    numDays: 3,
    accommodationLocation: '',
    cuisineTypes: [] as string[],
    coffeeShopsPerDay: 1,
    culturalInterests: [] as string[],
    shoppingPreferences: [] as string[],
    activityLevel: 'moderate' as 'relaxed' | 'moderate' | 'packed',
    userRecommendations: '',
  });

  // Cycle through loading steps
  useEffect(() => {
    if (!isLoading) {
      setLoadingStep(0);
      return;
    }

    const timers: NodeJS.Timeout[] = [];
    let accumulated = 0;

    for (let i = 1; i < loadingSteps.length; i++) {
      accumulated += loadingSteps[i - 1].duration;
      const timer = setTimeout(() => setLoadingStep(i), accumulated);
      timers.push(timer);
    }

    return () => timers.forEach(t => clearTimeout(t));
  }, [isLoading]);

  const handleCheckboxChange = (field: 'cuisineTypes' | 'culturalInterests' | 'shoppingPreferences', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value]
    }));
  };

  const handlePlacesExtracted = useCallback((places: string[]) => {
    setFormData(prev => {
      // Merge with existing recommendations
      const existing = prev.userRecommendations
        ? prev.userRecommendations.split(',').map(s => s.trim()).filter(Boolean)
        : [];
      const merged = [...new Set([...existing, ...places])];
      return {
        ...prev,
        userRecommendations: merged.join(', '),
      };
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: formData.destination,
          numDays: formData.numDays,
          accommodationLocation: formData.accommodationLocation || undefined,
          preferences: {
            cuisineTypes: formData.cuisineTypes,
            coffeeShopsPerDay: formData.coffeeShopsPerDay,
            culturalInterests: formData.culturalInterests,
            shoppingPreferences: formData.shoppingPreferences,
            activityLevel: formData.activityLevel,
            userRecommendations: formData.userRecommendations
              ? formData.userRecommendations.split(',').map(s => s.trim()).filter(Boolean)
              : undefined,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to create plan');

      const { id } = await response.json();
      router.push(`/plan/${id}`);
    } catch (error) {
      console.error('Error creating plan:', error);
      alert('Failed to create itinerary. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner" />
          <p style={{ fontFamily: 'var(--font-whimsical)', fontSize: '1.25rem', marginBottom: '1rem' }}>
            Creating your magical itinerary...
          </p>
          <div className="loading-steps">
            {loadingSteps.map((step, index) => (
              <div
                key={index}
                className={`loading-step ${index === loadingStep ? 'active' : ''} ${index < loadingStep ? 'completed' : ''}`}
              >
                <span className="step-indicator">
                  {index < loadingStep ? '✓' : index === loadingStep ? '...' : '○'}
                </span>
                <span className="step-text">{step.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="header">
        <h1>Travel Itinerary Planner</h1>
        <p>Create beautiful, interactive travel itineraries with AI-powered suggestions</p>
        <Link href="/dashboard" className="btn btn-secondary" style={{ marginTop: '1rem' }}>
          View My Itineraries
        </Link>
      </div>

      <div className="container" style={{ padding: '2rem 1rem', maxWidth: '800px' }}>
        <div className="day-card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Destination *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Tokyo, Japan"
                value={formData.destination}
                onChange={e => setFormData(prev => ({ ...prev, destination: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Trip Duration</label>
              <select
                className="form-input form-select"
                value={formData.numDays}
                onChange={e => setFormData(prev => ({ ...prev, numDays: parseInt(e.target.value) }))}
              >
                {[1, 2, 3, 4, 5, 6, 7, 10, 14].map(n => (
                  <option key={n} value={n}>{n} {n === 1 ? 'day' : 'days'}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Accommodation Location (optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Shinjuku, near train station"
                value={formData.accommodationLocation}
                onChange={e => setFormData(prev => ({ ...prev, accommodationLocation: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Cuisine Preferences</label>
              <div className="checkbox-group">
                {cuisineOptions.map(cuisine => (
                  <label key={cuisine} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.cuisineTypes.includes(cuisine)}
                      onChange={() => handleCheckboxChange('cuisineTypes', cuisine)}
                    />
                    {cuisine}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Coffee Shops Per Day</label>
              <div className="checkbox-group">
                {[0, 1, 2, 3].map(count => (
                  <label key={count} className="checkbox-label">
                    <input
                      type="radio"
                      name="coffeeShopsPerDay"
                      checked={formData.coffeeShopsPerDay === count}
                      onChange={() => setFormData(prev => ({ ...prev, coffeeShopsPerDay: count }))}
                    />
                    {count === 0 ? 'None' : count === 1 ? '1 coffee shop' : `${count} coffee shops`}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Cultural Interests</label>
              <div className="checkbox-group">
                {culturalOptions.map(interest => (
                  <label key={interest} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.culturalInterests.includes(interest)}
                      onChange={() => handleCheckboxChange('culturalInterests', interest)}
                    />
                    {interest}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Shopping Preferences</label>
              <div className="checkbox-group">
                {shoppingOptions.map(pref => (
                  <label key={pref} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.shoppingPreferences.includes(pref)}
                      onChange={() => handleCheckboxChange('shoppingPreferences', pref)}
                    />
                    {pref}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Activity Level</label>
              <div className="checkbox-group">
                {(['relaxed', 'moderate', 'packed'] as const).map(level => (
                  <label key={level} className="checkbox-label">
                    <input
                      type="radio"
                      name="activityLevel"
                      checked={formData.activityLevel === level}
                      onChange={() => setFormData(prev => ({ ...prev, activityLevel: level }))}
                    />
                    {level === 'relaxed' ? 'Relaxed (2-3 activities/day)' :
                     level === 'moderate' ? 'Moderate (4-5 activities/day)' :
                     'Packed (6+ activities/day)'}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Your Specific Recommendations (optional)</label>
              <p style={{ fontSize: '0.85rem', color: 'var(--ghibli-text-muted)', marginBottom: '0.75rem' }}>
                Upload a file or type places you want to visit
              </p>

              <FileUpload
                onPlacesExtracted={handlePlacesExtracted}
                disabled={isLoading}
              />

              <textarea
                className="form-input form-textarea"
                placeholder="Enter specific places you want to visit, separated by commas. e.g., Ichiran Ramen, Meiji Shrine, Tsukiji Outer Market"
                value={formData.userRecommendations}
                onChange={e => setFormData(prev => ({ ...prev, userRecommendations: e.target.value }))}
                style={{ marginTop: '0.75rem' }}
              />
              <p style={{ fontSize: '0.85rem', color: 'var(--ghibli-text-muted)', marginTop: '0.5rem' }}>
                These will be incorporated into your itinerary
              </p>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem' }}>
              Create My Itinerary
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
