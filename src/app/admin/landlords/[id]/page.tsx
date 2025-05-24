import LandlordDetailsClient from './client';

// Simple server component that passes id to client component
export default function LandlordDetailsPage({ params }: { params: { id: string } }) {
  return <LandlordDetailsClient id={params.id} />;
}
