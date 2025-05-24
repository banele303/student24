import dynamic from 'next/dynamic';

// Import the client component with no SSR to avoid hydration issues
const LandlordDetailsClient = dynamic(() => import('./client'), { ssr: false });

// Server component that passes id to client component
export default function LandlordDetailsPage({ params }: { params: { id: string } }) {
  return <LandlordDetailsClient id={params.id} />;
}
