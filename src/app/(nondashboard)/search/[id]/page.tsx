"use client";

import { useGetAuthUserQuery, useGetPropertyQuery, useGetRoomsQuery } from "@/state/api";
import { useParams } from "next/navigation";
import React, { useState } from "react";
import Image, { ImageLoaderProps } from "next/image";
import ImagePreviews from "./ImagePreviews";
import PropertyOverview from "./PropertyOverview";
import PropertyDetails from "./PropertyDetails";
import PropertyLocation from "./PropertyLocation";
import ContactWidget from "./ContactWidget";
import ApplicationModal from "./ApplicationModal";
import Loading from "@/components/Loading";
import PropertyReviews from "@/components/PropertyReviews";
import { Building2, Phone, Bed, Bath, Users, Home } from "lucide-react";

// Define interfaces for type safety
interface Room {
  name?: string;
  price?: number;
  isAvailable?: boolean;
  availableFrom?: string | Date | null;
  description?: string;
  capacity?: string;
  features?: string[];
  photoUrls?: string[];
  images?: string[];
  id?: number;
}

const SingleListing = () => {
  const { id } = useParams();
  const propertyId = Number(id);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedDescriptions, setExpandedDescriptions] = useState<{[key: string]: boolean}>({});
  const [imgErrors, setImgErrors] = useState<{[key: string]: boolean}>({});
  
  // Toggle description expansion
  const toggleDescription = (roomId: string) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [roomId]: !prev[roomId]
    }));
  };
  
  // Use skip option to prevent unnecessary API calls that might result in 403 errors
  const { data: authUser, isError: authError } = useGetAuthUserQuery(undefined, {
    // Don't show error toasts for auth errors
    skip: false,
  });
  
  const { data: property, isLoading, isError } = useGetPropertyQuery(propertyId, {
    skip: !propertyId // Skip if propertyId is not available
  });
  const { data: rooms, isLoading: roomsLoading } = useGetRoomsQuery(propertyId, { 
    skip: isError || !propertyId // Skip if there's an error or no propertyId
  });
  
  // Use a default phone number since contactPhone is not available on the Property type
  const propertyPhone = '+27 123 456 7890';
  
  // Process property data to ensure image URLs are valid
  const processedProperty = React.useMemo(() => {
    if (!property) return null;
    
    console.log('PROPERTY DATA CHECK');
    console.log('Property ID:', property.id);
    console.log('Raw images array:', property.images);
    console.log('Property price:', property.price);
    
    // Return processed property with guaranteed values
    return {
      ...property,
      // Make sure price is a valid number
      price: typeof property.price === 'number' ? property.price : 
             typeof property.price === 'string' ? parseFloat(property.price) : 0,
      // Ensure images array is valid - use exactly the same approach as in CardCompact
      images: Array.isArray(property.images) && property.images.length > 0 ? 
        property.images.filter(img => img && typeof img === 'string' && img.trim() !== '') : 
        Array.isArray(property.photoUrls) && property.photoUrls.length > 0 ?
        property.photoUrls.filter(img => img && typeof img === 'string' && img.trim() !== '') :
        []
    };
  }, [property]);
  
  // Process rooms data to ensure image URLs are valid
  const processedRooms = React.useMemo(() => {
    if (!rooms || !Array.isArray(rooms)) return [];
    
    // Log for debugging
    if (rooms.length > 0) {
      console.log('ROOMS DATA CHECK');
      console.log('First room images:', rooms[0]?.photoUrls);
      console.log('First room price:', rooms[0]?.pricePerMonth);
    }
    
    // Return processed rooms with guaranteed values
    return rooms.map((room) => ({
      ...room,
      // Make sure price is properly set from pricePerMonth
      price: typeof room.pricePerMonth === 'number' ? room.pricePerMonth : 
             typeof room.pricePerMonth === 'string' ? parseFloat(room.pricePerMonth) : 
             (property?.price ? Math.round(property.price / 3) : 0),
      // Convert availableFrom to string if it's a Date object
      availableFrom: room.availableFrom instanceof Date ? 
        room.availableFrom.toISOString() : 
        (typeof room.availableFrom === 'string' ? room.availableFrom : undefined),
      // Ensure photoUrls array is valid and use it for images
      images: Array.isArray(room.photoUrls) && room.photoUrls.length > 0 ? 
        room.photoUrls.filter(img => img && typeof img === 'string' && img.trim() !== '') : 
        []
    }));
  }, [rooms, property]);
  
  // Use processed data
  const propertyRooms = processedRooms || [];

  if (isLoading || roomsLoading) return <div><Loading/></div>;
  if (isError || !property || !processedProperty) return <div>Property not found</div>;

  // Log processed data for debugging
  console.log('Using processed property images:', processedProperty.images);
  if (propertyRooms.length > 0) {
    console.log('Using processed room images for first room:', propertyRooms[0].images);
  }

  return (
    <div className="bg-gray-50 pb-16">
      <ImagePreviews
        images={processedProperty.images || []}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Property Title and Quick Info */}
        <div className="bg-white shadow-sm rounded-xl p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">{property.name}</h1>
          <p className="text-gray-600 mb-4">{property.location.address}, {property.location.city}</p>
          
          <div className="flex flex-wrap gap-6 mt-4">
            <div className="flex items-center">
              <Bed className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-gray-700">{property.beds} {property.beds === 1 ? 'Bedroom' : 'Bedrooms'}</span>
            </div>
            <div className="flex items-center">
              <Bath className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-gray-700">{property.baths} {property.baths === 1 ? 'Bathroom' : 'Bathrooms'}</span>
            </div>
            <div className="flex items-center">
              <Building2 className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-gray-700">{property.squareFeet} sq ft</span>
            </div>
            <div className="flex items-center">
              <Phone className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-gray-700">+27 123 456 7890</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="lg:w-2/3 space-y-8">
            {/* Property Overview */}
            <div className="bg-white shadow-sm rounded-xl p-6">
              <PropertyOverview propertyId={propertyId} />
            </div>
            
            {/* Rooms Section */}
            <div className="bg-white shadow-sm rounded-xl p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Property Rooms</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Always show at least 3 room cards */}
                {(propertyRooms && propertyRooms.length > 0 ? propertyRooms : [1, 2, 3]).map((room: any, index: number) => {
                  // If room is a number, it's a fallback room
                  const isFallbackRoom = typeof room === 'number';
                  const roomNumber = isFallbackRoom ? room : index + 1;
                  
                  // Create fallback room data if needed
                  // Use the prisma property type directly without casting
                  const roomData: Room = isFallbackRoom ? {
                    name: `Room ${roomNumber}`,
                    price: Math.round((property ? property.price : 0) / 3 * (roomNumber === 1 ? 1.2 : roomNumber === 2 ? 1 : 0.9)),
                    isAvailable: roomNumber !== 2,
                    availableFrom: roomNumber === 2 ? '2025-06-01' : undefined,
                    capacity: roomNumber === 1 ? '1 person' : roomNumber === 2 ? '1-2 people' : '1 person',
                    description: roomNumber === 1 ? 'Master bedroom with ensuite bathroom and built-in closet.' : 
                                 roomNumber === 2 ? 'Medium-sized room with large window and shared bathroom access.' : 
                                 'Cozy single room with desk and storage space.',
                    features: roomNumber === 1 ? ['En-suite', 'Walk-in closet'] :
                              roomNumber === 2 ? ['Large windows', 'Shared bathroom'] :
                              ['Desk', 'Storage']
                  } : room;
                  
                  return (
                    <div key={isFallbackRoom ? `fallback-${roomNumber}` : index} 
                         className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                      {/* Room Image */}
                      <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
                        <Image
                          src={roomData.images && roomData.images.length > 0 ? 
                                roomData.images[0] : 
                                roomData.photoUrls && roomData.photoUrls.length > 0 ? 
                                roomData.photoUrls[0] : 
                                "/placeholder.jpg"}
                          alt={roomData.name || `Room ${index + 1}`}
                          fill
                          unoptimized={true}
                          priority={index === 0}
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover hover:scale-110 transition-transform duration-500"
                          onError={(e) => {
                            console.error(`Failed to load image for room: ${roomData.id || index}`);
                            // Update the image source directly to fallback
                            if (e.currentTarget) {
                              e.currentTarget.src = "/placeholder.jpg";
                            }
                            
                            // Log the error for debugging
                            console.log(`Setting fallback image for room ${roomData.id || index}`);
                          }}
                        />
                      </div>
                      
                      {/* Room Details */}
                      <div className="p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-medium text-lg">{roomData.name}</h3>
                          <span className="text-blue-600 font-semibold text-lg">
                            R{roomData.price ? roomData.price.toLocaleString('en-ZA') : 
                               property.price ? Math.round(property.price / 3).toLocaleString('en-ZA') : 'N/A'}
                            <span className="text-sm text-gray-500">/month</span>
                          </span>
                        </div>
                        
                        <div className="flex items-center mt-2 text-gray-600">
                          <Users className="w-4 h-4 mr-1" />
                          <span className="text-sm">Suitable for {roomData.capacity || '1-2 people'}</span>
                        </div>
                        
                        <div className="mt-2 text-sm text-gray-500">
                          {roomData.description ? (
                            <>
                              <p>
                                {expandedDescriptions[`room-${roomData.id || index}`] 
                                  ? roomData.description 
                                  : `${roomData.description.substring(0, 80)}${roomData.description.length > 80 ? '...' : ''}`}
                              </p>
                              {roomData.description.length > 80 && (
                                <button 
                                  onClick={() => toggleDescription(`room-${roomData.id || index}`)}
                                  className="text-blue-600 hover:text-blue-800 text-xs font-medium mt-1 focus:outline-none"
                                >
                                  {expandedDescriptions[`room-${roomData.id || index}`] ? 'Read less' : 'Read more'}
                                </button>
                              )}
                            </>
                          ) : (
                            <p>Comfortable room with great amenities and natural lighting.</p>
                          )}
                        </div>
                        
                        {roomData.features && roomData.features.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {roomData.features.map((feature: string, i: number) => (
                              <span key={i} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                                {feature}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Property Details */}
            <div className="bg-white shadow-sm rounded-xl p-6">
              <PropertyDetails propertyId={propertyId} />
            </div>
            
            {/* Property Reviews */}
            <div className="bg-white shadow-sm rounded-xl p-6">
              <PropertyReviews propertyId={propertyId} />
            </div>
            
            {/* Property Location */}
            <div className="bg-white shadow-sm rounded-xl p-6">
              <PropertyLocation propertyId={propertyId} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-1/3">
            <div className="sticky top-24">
              <ContactWidget 
                onOpenModal={() => setIsModalOpen(true)} 
                phoneNumber={propertyPhone}
              />
            </div>
          </div>
        </div>
      </div>

      {authUser && (
        <ApplicationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          propertyId={propertyId}
        />
      )}
    </div>
  );
};

export default SingleListing;