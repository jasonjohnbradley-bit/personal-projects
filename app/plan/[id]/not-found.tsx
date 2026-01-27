import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '2rem',
    }}>
      <h1 style={{ fontSize: '4rem', marginBottom: '1rem' }}>🍃</h1>
      <h2 style={{ fontFamily: 'var(--font-whimsical)', marginBottom: '1rem' }}>
        Itinerary Not Found
      </h2>
      <p style={{ color: 'var(--ghibli-grey)', marginBottom: '2rem' }}>
        This itinerary doesn&apos;t exist or may have been removed.
      </p>
      <Link href="/" className="btn btn-primary">
        Create a New Itinerary
      </Link>
    </div>
  );
}
