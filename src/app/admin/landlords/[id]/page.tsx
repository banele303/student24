
import LandlordDetails from './LandlordDetails';

// Server component that handles the params properly
export default async function LandlordDetailsPage({ params }: { params: { id: string } }) {
  // Properly handle the async params in Next.js 14+
  const id = await params.id;
  
  // Return the client component with the id
  return <LandlordDetails id={id} />;
}

