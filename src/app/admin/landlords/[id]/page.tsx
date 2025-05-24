
import dynamic from 'next/dynamic';

// Define interface for client component props
interface LandlordClientProps {
  id: string;
}

// Import client component with SSR disabled
const LandlordClient = dynamic(() => import('./LandlordDetails'), {
  ssr: false,
});

// Server component that handles the params properly
export default async function LandlordDetailsPage({ params }: { params: { id: string } }) {
  // Properly handle the async params in Next.js 14+
  const id = await params.id;
  
  // Return the client component with the id
  return <LandlordClient id={id} />;
}

