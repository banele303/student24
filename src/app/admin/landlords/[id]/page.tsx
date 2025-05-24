
import { Metadata } from "next";
import LandlordClient from "./client";

interface PageProps {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

// Simple server component that passes the ID parameter to the client component
export default async function LandlordDetailsPage({ params }: PageProps) {
  return <LandlordClient id={params.id} />;
}

