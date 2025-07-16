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
import { Building2, Bed, Bath, Users, Home } from "lucide-react";
import { getRoomStats } from "@/lib/roomUtils";

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
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState<{[key: string]: boolean}>({});
  const [imgErrors, setImgErrors] = useState<{[key: string]: boolean}>({});

  // University logo mapping
  const getUniversityLogo = (universityName: string): string | null => {
    const universityMap: { [key: string]: string } = {
      // University of Cape Town variations
      "UCT": "/universities/UCT-university.png",
      "University of Cape Town": "/universities/UCT-university.png",
      "uct": "/universities/UCT-university.png",
      
      // University of the Witwatersrand variations
      "Wits": "/universities/Witwatersrand,-univesity.jpg",
      "University of the Witwatersrand": "/universities/Witwatersrand,-univesity.jpg",
      "Witwatersrand": "/universities/Witwatersrand,-univesity.jpg",
      "wits": "/universities/Witwatersrand,-univesity.jpg",
      
      // University of the Western Cape variations
      "UWC": "/universities/UWC_Logo.svg",
      "University of the Western Cape": "/universities/UWC_Logo.svg",
      "uwc": "/universities/UWC_Logo.svg",
      
      // University of Johannesburg variations
      "UJ": "/universities/University-Johannesburg.svg",
      "University of Johannesburg": "/universities/University-Johannesburg.svg",
      "uj": "/universities/University-Johannesburg.svg",
      
      // University of Limpopo variations
      "UL": "/universities/University_of_Limpopo_logo.svg",
      "University of Limpopo": "/universities/University_of_Limpopo_logo.svg",
      "ul": "/universities/University_of_Limpopo_logo.svg",
      
      // University of the Free State variations
      "UFS": "/universities/University-FreeState.svg",
      "University of the Free State": "/universities/University-FreeState.svg",
      "ufs": "/universities/University-FreeState.svg",
      
      // Stellenbosch University variations
      "Stellenbosch": "/universities/Stellenbosch.jpg",
      "Stellenbosch University": "/universities/Stellenbosch.jpg",
      "stellenbosch": "/universities/Stellenbosch.jpg",
      
      // Rhodes University variations
      "Rhodes": "/universities/Rhodes-university.png",
      "Rhodes University": "/universities/Rhodes-university.png",
      "rhodes": "/universities/Rhodes-university.png",
      
      // University of Pretoria variations
      "UP": "/universities/pretoria.webp",
      "University of Pretoria": "/universities/pretoria.webp",
      "up": "/universities/pretoria.webp",
      
      // University of KwaZulu-Natal variations
      "UKZN": "/universities/kzn.png",
      "University of KwaZulu-Natal": "/universities/kzn.png",
      "ukzn": "/universities/kzn.png",
    };

    // Check for exact match first, then try lowercase
    return universityMap[universityName] || universityMap[universityName.toLowerCase()] || null;
  };
  
  // Debug modal state changes
  React.useEffect(() => {
    console.log('Modal state changed:', { isModalOpen, selectedRoom });
  }, [isModalOpen, selectedRoom]);
  
  // Toggle description expansion
  const toggleDescription = (roomId: string) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [roomId]: !prev[roomId]
    }));
  };

  // Handle keyboard events for modal
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isImageModalOpen) {
          setIsImageModalOpen(false);
        } else if (isModalOpen) {
          setIsModalOpen(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isImageModalOpen, isModalOpen]);
  
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
  
  // Process property data to ensure image URLs are valid
  const processedProperty = React.useMemo(() => {
    if (!property) return null;
    
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
    
    // Return processed rooms with guaranteed values
    return rooms.map((room) => ({
      ...room,
      // Make sure price is properly set from pricePerMonth
      price: typeof room.pricePerMonth === 'number' ? room.pricePerMonth : 
             typeof room.pricePerMonth === 'string' ? parseFloat(room.pricePerMonth) : 
             undefined,
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

  // Calculate room-based statistics
  const roomStats = getRoomStats(rooms);
  
  // Use room stats or fallback to property values for backward compatibility
  const displayBeds = roomStats.totalBeds || property?.beds || 0;
  const displayBaths = roomStats.totalBaths || property?.baths || 0;
  const displaySquareFeet = roomStats.totalSquareFeet || property?.squareFeet || 0;

  if (isLoading || roomsLoading) return <div><Loading/></div>;
  if (isError || !property || !processedProperty) return <div>Property not found</div>;

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Full Width Image Gallery */}
        <div className="mb-8">
          {/* Desktop Layout */}
          <div className="hidden md:grid md:grid-cols-6 gap-4 h-[600px]">
            {/* Main large image - takes 4/6 of the width (66.67%) */}
            <div className="col-span-4 relative rounded-lg overflow-hidden cursor-pointer" onClick={() => setIsImageModalOpen(true)}>
              <Image
                src={processedProperty.images?.[0] || "/placeholder.jpg"}
                alt={property.name}
                fill
                className="object-cover hover:scale-105 transition-transform duration-300"
                unoptimized={true}
              />
            </div>
            
            {/* Right side images - takes 2/6 of the width with 1 column and rectangular layout */}
            <div className="col-span-2 flex flex-col gap-4 relative">
              {processedProperty.images?.slice(1, 5).map((image, index) => (
                <div key={index} className="relative h-[140px] rounded-lg overflow-hidden cursor-pointer" onClick={() => setIsImageModalOpen(true)}>
                  <Image
                    src={image || "/placeholder.jpg"}
                    alt={`${property.name} ${index + 2}`}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-300"
                    unoptimized={true}
                  />
                </div>
              )) || 
              // Fallback images if not enough property images
              Array.from({ length: 4 }, (_, index) => (
                <div key={`fallback-${index}`} className="relative h-[140px] rounded-lg overflow-hidden bg-gray-200">
                  <div className="w-full h-full flex items-center justify-center">
                    <Home className="h-8 w-8 text-gray-400" />
                  </div>
                </div>
              ))}
              
              {/* View all button positioned at bottom right of the last image */}
              {processedProperty.images && processedProperty.images.length > 1 && (
                <div className="absolute bottom-4 right-4 z-10">
                  <button 
                    onClick={() => setIsImageModalOpen(true)}
                    className="bg-white/90 text-gray-800 px-3 py-2 rounded-lg text-xs font-medium hover:bg-white transition-colors shadow-lg"
                  >
                    View all ({processedProperty.images.length})
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden">
            {/* Main image for mobile */}
            <div className="relative h-[350px] rounded-lg overflow-hidden cursor-pointer mb-4" onClick={() => setIsImageModalOpen(true)}>
              <Image
                src={processedProperty.images?.[0] || "/placeholder.jpg"}
                alt={property.name}
                fill
                className="object-cover"
                unoptimized={true}
              />
            </div>
            
            {/* Mobile image grid - rectangular layout */}
            <div className="grid grid-cols-1 gap-3">
              {processedProperty.images?.slice(1, 4).map((image, index) => (
                <div key={index} className="relative h-32 rounded-lg overflow-hidden cursor-pointer" onClick={() => setIsImageModalOpen(true)}>
                  <Image
                    src={image || "/placeholder.jpg"}
                    alt={`${property.name} ${index + 2}`}
                    fill
                    className="object-cover"
                    unoptimized={true}
                  />
                </div>
              )) || 
              // Fallback for mobile
              Array.from({ length: 3 }, (_, index) => (
                <div key={`fallback-mobile-${index}`} className="relative h-32 rounded-lg overflow-hidden bg-gray-200">
                  <div className="w-full h-full flex items-center justify-center">
                    <Home className="h-6 w-6 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
            
            {/* View all button for mobile */}
            {processedProperty.images && processedProperty.images.length > 1 && (
              <button 
                onClick={() => setIsImageModalOpen(true)}
                className="mt-4 w-full bg-blue-600 text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                View all {processedProperty.images.length} photos
              </button>
            )}
          </div>
        </div>

        {/* Property Information Below Images */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Left Column - Property Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Header */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{property.name}</h1>
                  
                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className={`h-5 w-5 ${i < Math.floor(property.averageRating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">{(property.averageRating || 0).toFixed(1)} ({property.numberOfReviews || 0} reviews)</span>
                  </div>
                </div>
                
                {/* Favorite and Share buttons */}
                <div className="flex items-center gap-2">
                  <button className="p-3 rounded-full hover:bg-gray-100 transition-colors border border-gray-200">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.682l-1.318-1.364a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                  <button className="p-3 rounded-full hover:bg-gray-100 transition-colors border border-gray-200">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Location and University */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <svg className="h-6 w-6 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <p className="text-gray-800 font-medium text-lg">{property.location?.address || 'No address'}</p>
                  <p className="text-gray-600">{property.location?.city || 'No city'}</p>
                </div>
              </div>
              
              {/* Close to University - Only show if data exists */}
              {property.closestUniversities?.[0] && (
                <div className="flex items-center gap-3">
                  {/* University Logo or Default Icon */}
                  {(() => {
                    const universityLogo = getUniversityLogo(property.closestUniversities[0]);
                    
                    if (universityLogo) {
                      return (
                        <div className="w-12 h-12 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center overflow-hidden">
                          <Image
                            src={universityLogo}
                            alt={`${property.closestUniversities[0]} logo`}
                            width={40}
                            height={40}
                            className="object-contain"
                            unoptimized={true}
                          />
                        </div>
                      );
                    } else {
                      return (
                        <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
                          <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                      );
                    }
                  })()}
                  <span className="text-gray-700 font-medium">Close to {property.closestUniversities[0]}</span>
                </div>
              )}
            </div>

            {/* Property Description */}
            {property.description && (
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-3">About this property</h3>
                <p className="text-gray-700 leading-relaxed">
                  {property.description}
                </p>
              </div>
            )}
          </div>

          {/* Right Column - Pricing Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              {/* Pricing Section */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm text-gray-600">From</p>
                    <p className="text-3xl font-bold text-blue-600">
                      R {(roomStats.minPrice || property.price).toLocaleString('en-ZA')}
                    </p>
                    <p className="text-sm text-gray-600">per month</p>
                  </div>
                  
                  {/* NSFAS Logo */}
                  {property.isNsfassAccredited && (
                    <div className="flex items-center">
                      <Image
                        src="/universities/nasfas.png"
                        alt="NSFAS Accredited"
                        width={70}
                        height={70}
                        className="object-contain"
                      />
                    </div>
                  )}
                </div>

                {/* Deposit Info - Only show if data exists */}
                {property.securityDeposit !== undefined && (
                  <div className="py-4 border-t border-gray-100">
                    <div>
                      <p className="text-sm text-gray-600">Security Deposit</p>
                      <p className="font-semibold">
                        {property.securityDeposit === 0 ? 'None' : `R${property.securityDeposit.toLocaleString('en-ZA')}`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Contact/Apply Button */}
                <div className="mt-6 space-y-3">
                  <button 
                    onClick={() => {
                      // Scroll to rooms section
                      const roomsSection = document.getElementById('rooms-section');
                      if (roomsSection) {
                        roomsSection.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                  >
                    View Available Rooms
                  </button>
                  <button className="w-full border border-gray-300 hover:border-gray-400 text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors">
                    Contact Property
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Rooms and Details */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - 2/3 width */}
          <div className="lg:col-span-2 space-y-8">
            {/* Rooms Section */}
            {propertyRooms && propertyRooms.length > 0 && (
              <div id="rooms-section" className="bg-white shadow-sm rounded-xl p-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Available Rooms</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {propertyRooms.map((room: any, index: number) => (
                    <div key={room.id || index} 
                         className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                      {/* Room Image */}
                      <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
                        <Image
                          src={room.images && room.images.length > 0 ? 
                               room.images[0] : "/placeholder.jpg"}
                          alt={room.name || `Room ${index + 1}`}
                          fill
                          className="object-cover"
                          onError={() => setImgErrors(prev => ({...prev, [`room-${index}`]: true}))}
                          unoptimized={true}
                        />
                        
                        {/* Availability badge */}
                        <div className="absolute top-3 left-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            room.isAvailable 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {room.isAvailable ? 'Available' : 'Coming Soon'}
                          </span>
                        </div>
                        
                        {/* Price badge */}
                        <div className="absolute top-3 right-3 bg-blue-600 text-white px-2 py-1 rounded text-sm font-medium">
                          R{room.price?.toLocaleString('en-ZA') || '0'}
                        </div>
                      </div>
                      
                      {/* Room Info */}
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-lg">{room.name}</h3>
                          {room.capacity && (
                            <span className="text-sm text-gray-500">{room.capacity}</span>
                          )}
                        </div>
                        
                        {room.description && (
                          <div className="text-gray-600 text-sm mb-3">
                            {expandedDescriptions[`room-${room.id || index}`] ? 
                              room.description : 
                              `${room.description.substring(0, 80)}${room.description.length > 80 ? '...' : ''}`
                            }
                            {room.description.length > 80 && (
                              <button
                                onClick={() => toggleDescription(`room-${room.id || index}`)}
                                className="text-blue-600 hover:text-blue-800 text-xs font-medium mt-1 focus:outline-none"
                              >
                                {expandedDescriptions[`room-${room.id || index}`] ? 'Read less' : 'Read more'}
                              </button>
                            )}
                          </div>
                        )}
                        
                        {room.features && room.features.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {(() => {
                              let featuresArray;
                              
                              // Handle different formats of features
                              if (Array.isArray(room.features)) {
                                featuresArray = room.features;
                              } else if (typeof room.features === 'string') {
                                try {
                                  featuresArray = JSON.parse(room.features);
                                } catch {
                                  // If it's not valid JSON, treat as a single feature
                                  featuresArray = [room.features];
                                }
                              } else {
                                featuresArray = [];
                              }
                              
                              return featuresArray.map((feature: string, i: number) => (
                                <span key={i} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                                  {feature}
                                </span>
                              ));
                            })()}
                          </div>
                        )}
                        
                        {room.availableFrom && !room.isAvailable && (
                          <div className="mt-3 text-sm text-gray-600">
                            Available from: {new Date(room.availableFrom).toLocaleDateString()}
                          </div>
                        )}

                        {/* Room-specific Apply button */}
                        <div className="mt-4">
                          <button 
                            onClick={() => {
                              console.log('Apply button clicked for room:', room);
                              console.log('Room ID:', room.id);
                              console.log('Room name:', room.name);
                              setSelectedRoom(room);
                              setIsModalOpen(true);
                            }}
                            className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                              room.isAvailable 
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                            disabled={!room.isAvailable}
                          >
                            {room.isAvailable ? 'Apply for this Room' : 'Not Available'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
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

          {/* Sidebar - 1/3 width */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <ContactWidget 
                onOpenModal={() => setIsModalOpen(true)} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Image Gallery Modal */}
      {isImageModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div 
            className="relative bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">{property.name} - Gallery</h3>
              <button
                onClick={() => setIsImageModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Image Preview Component */}
            <div className="p-4">
              <ImagePreviews images={processedProperty.images || []} />
            </div>
          </div>
        </div>
      )}

      {/* Application Modal - Single instance with proper authentication check */}
      {authUser && isModalOpen && selectedRoom && (
        <ApplicationModal
          isOpen={isModalOpen}
          onClose={() => {
            console.log('Closing application modal');
            setIsModalOpen(false);
            setSelectedRoom(null);
          }}
          propertyId={propertyId}
          roomId={selectedRoom?.id}
          roomName={selectedRoom?.name}
        />
      )}
    </div>
  );
};

export default SingleListing;