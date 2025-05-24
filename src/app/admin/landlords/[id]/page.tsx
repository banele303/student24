
import { Metadata } from "next";
import LandlordClient from "./client";

type Props = {
  params: { id: string }
};

// Simple server component that passes the ID parameter to the client component
async function LandlordDetailsPage({ params }: Props) {
  return <LandlordClient id={params.id} />;
}

export default LandlordDetailsPage;
