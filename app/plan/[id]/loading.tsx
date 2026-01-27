export default function Loading() {
  return (
    <div className="loading-overlay">
      <div className="spinner" />
      <p style={{ fontFamily: 'var(--font-whimsical)' }}>
        Loading your itinerary...
      </p>
    </div>
  );
}
