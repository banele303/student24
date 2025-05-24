
import LandlordClient from "./client";

// Simple server component that passes the ID parameter to the client component
export default function LandlordDetailsPage({ params }: { params: { id: string } }) {
  return <LandlordClient id={params.id} />;
}
