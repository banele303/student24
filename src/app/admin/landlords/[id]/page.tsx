
import LandlordClient from "./client";

// Simple server component that passes the ID parameter to the client component
export default async function LandlordDetailsPage({ params }: { params: { id: string } }) {
  // In Next.js 14+, params need to be awaited before use
  const resolvedParams = await Promise.resolve(params);
  return <LandlordClient id={resolvedParams.id} />;
}

