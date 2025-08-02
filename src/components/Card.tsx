"use client"

import type React from "react"
import type { ImageLoaderProps } from "next/image"
import { Bath, Bed, ChefHat, Edit, Heart, Home, MapPin, Star, Trash2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getRoomStats } from "@/lib/roomUtils"
import type { Room } from "@/types/prismaTypes"

interface PropertyCardProps {
  property: {
    id: number
    name: string
    description?: string
    location: {
      address: string
      city: string
    }
    photoUrls?: string[]
    images?: string[]
    beds: number
    baths: number
    kitchens?: number
    squareFeet: number
    pricePerMonth?: number
    price?: number
    averageRating?: number
    numberOfReviews: number
    isPetsAllowed?: boolean
    isParkingIncluded?: boolean
    isNsfassAccredited?: boolean
    availableRooms?: number
    rooms?: Room[] // Add rooms data for calculation
    closestUniversities?: string[]
  }
  isFavorite?: boolean
  onFavoriteToggle?: () => void
  showFavoriteButton?: boolean
  propertyLink?: string
  showActions?: boolean
  userRole?: "tenant" | "manager" | "admin" | null
  onClick?: () => void
}

function PropertyCard({
  property,
  isFavorite = false,
  onFavoriteToggle,
  showFavoriteButton = true,
  propertyLink,
  showActions = false,
  userRole = null,
  onClick,
}: PropertyCardProps) {
  // Access images directly from the property object as it comes from the API
  const [imgSrc, setImgSrc] = useState<string>(
    // First try images array
    property.images && property.images.length > 0 ? property.images[0] :
    // Then try photoUrls array
    property.photoUrls && property.photoUrls.length > 0 ? property.photoUrls[0] :
    // Default placeholder
    "/placeholder.jpg"
  )
  const [isHovered, setIsHovered] = useState(false)
  const [imgError, setImgError] = useState(false)

  // Calculate room-based statistics for price fallback
  const roomStats = getRoomStats(property.rooms);
  
  // Use property-level specifications directly
  const displayBeds = property.beds || 0;
  const displayBaths = property.baths || 0;
  const displayKitchens = property.kitchens || 0;
  const displaySquareFeet = property.squareFeet || 0;
  const displayPrice = roomStats.minPrice || property.price || property.pricePerMonth || 0;

  // Custom loader that just returns the URL as-is
  const loaderFunc = ({ src }: ImageLoaderProps) => {
    return src
  }

  // Handle image error
  const handleImageError = () => {
    console.error(`Failed to load image: ${imgSrc}`)
    setImgError(true)
    setImgSrc("/placeholder.jpg")
  }

  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <Card
      className="group overflow-hidden transition-all mt-6 duration-300 hover:shadow-xl hover:ring-4 hover:ring-blue-600/50 border border-gray-200 bg-white rounded-3xl relative w-full cursor-pointer transform hover:scale-[1.02] shadow-sm"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div className="relative w-full aspect-[4/2] px-2 mt-[-1rem] ">
        <div className="relative w-full h-full">
          {!imgError ? (
            <Image
              src={imgSrc}
              alt={property.name}
              fill
              loader={loaderFunc}
              unoptimized={true}
              className={`object-cover transition-transform rounded-2xl duration-500 ${isHovered ? "scale-110" : "scale-100"}`}
              onError={handleImageError}
              
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-2xl">
              <Home className="h-12 w-12 text-gray-400" />
            </div>
          )}
        </div>

        {/* Price tag - Now clearly in Rands with "From" prefix and green background */}
        <div className="absolute top-3 right-3 z-20">
          <div className="bg-green-500 shadow-md text-white px-3 py-1.5 rounded-2xl flex items-center border border-green-500">
            <span className="text-xs text-green-100 mr-1">From</span>
            <span className="font-bold">R {displayPrice.toLocaleString('en-ZA')}</span>
          </div>
        </div>
        
        {/* Available rooms badge */}
        {property.availableRooms !== undefined && property.availableRooms > 0 && (
          <div className="absolute top-3 left-3 z-20">
            <Badge className="bg-green-500 text-white text-xs font-medium rounded-2xl">
              {property.availableRooms} {property.availableRooms === 1 ? 'Room' : 'Rooms'} Available
            </Badge>
          </div>
        )}

        {/* Feature badges */}
        <div className="absolute bottom-3 left-3 flex flex-wrap gap-2 z-20">
          {property.isPetsAllowed && (
            <Badge className="bg-white/90 text-gray-800 text-xs font-medium backdrop-blur-sm border border-gray-200 rounded-2xl">
              Pets Allowed
            </Badge>
          )}
          {property.isParkingIncluded && (
            <Badge className="bg-white/90 text-gray-800 text-xs font-medium backdrop-blur-sm border border-gray-200 rounded-2xl">
              Parking Included
            </Badge>
          )}
        </div>

        {/* NSFAS and Favorite Icons - Positioned above the white background */}
        <div className="absolute bottom-2 right-3 flex items-center gap-2 z-50">
          {/* NSFAS Accredited Badge with Image */}
          {property.isNsfassAccredited && (
            <div className="relative w-[3.3rem] h-[3.3rem] bg-white rounded-full p-1 shadow-lg border border-gray-200">
              <Image
                src="/universities/nasfas.png"
                alt="NSFAS Accredited"
                width={44}
                height={44}
                className="w-full h-full rounded-full object-contain hover:scale-110 transition-transform duration-200"
                title="NSFAS Accredited Property"
              />
            </div>
          )}

          {/* Favorite button */}
          {showFavoriteButton && (
            <Button
              size="icon"
              variant="ghost"
              className={`h-[3.3rem] w-[3.3rem] rounded-full p-0 transition-all duration-300 ${
                isFavorite 
                  ? "bg-white text-red-500 shadow-lg border border-gray-200 scale-105" 
                  : "bg-white/95 text-gray-600 border border-gray-200 shadow-lg hover:text-blue-600 hover:scale-105"
              }`}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onFavoriteToggle?.()
              }}
              title="Add to favorites"
            >
              <Heart className={`h-6 w-6 transition-all duration-300 ${isFavorite ? "fill-red-500" : ""}`} />
              <span className="sr-only">Toggle favorite</span>
            </Button>
          )}
        </div>
      </div>

      <div className="p-4 pt-5 space-y-3 bg-white">
        <div className="space-y-1">
          <h2 className="line-clamp-1 text-lg font-bold group-hover:text-blue-600">{propertyLink ? <Link href={propertyLink} className="hover:text-blue-600" scroll={false}>{property.name}</Link> : property.name}</h2>
          <div className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /><span className="text-xs font-medium">{(property.averageRating || 0).toFixed(1)} ({property.numberOfReviews || 0})</span></div>
          {property.description && <p className="text-sm text-gray-600 line-clamp-4">{property.description}</p>}
        </div>

        {/* Location and University Information */}
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-600">
            <div className="flex items-center justify-center w-7 h-7 bg-gray-100 rounded-full mr-2 flex-shrink-0">
              <MapPin className="h-3.5 w-3.5 text-blue-500" />
            </div>
            <p className="line-clamp-1 font-normal">
              {property.location?.address || 'No address'}, {property.location?.city || 'No city'}
            </p>
          </div>
          
          {/* Closest University */}
          {property.closestUniversities && property.closestUniversities.length > 0 && (
            <div className="flex items-center text-sm text-gray-600">
              <div className="flex items-center justify-center w-7 h-7 bg-gray-100 rounded-full mr-2 flex-shrink-0">
                <svg className="h-3.5 w-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <p className="line-clamp-1 font-normal italic">
                Close to {property.closestUniversities.slice(0, 2).join(", ")}
                {property.closestUniversities.length > 2 && ` +${property.closestUniversities.length - 2} more`}
              </p>
            </div>
          )}
        </div>
        
        {/* Room Information Section - Detailed view */}
        {property.availableRooms !== undefined && property.availableRooms > 0 && (
          <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-100">
            <h3 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
              <Bed className="h-4 w-4 mr-1" /> Available Rooms
            </h3>
            <div className="space-y-2">
              {/* Room example 1 */}
              <div className="bg-white p-2 rounded border border-blue-100 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">Standard Room</p>
                  <p className="text-xs text-gray-500 font-normal italic">Private Bath • 18m²</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#00acee]">R {Math.round(displayPrice * 0.6).toLocaleString('en-ZA')}</p>
                  <p className="text-xs text-gray-500">per month</p>
                </div>
              </div>
              
              {/* Room example 2 */}
              {property.availableRooms > 1 && (
                <div className="bg-white p-2 rounded border border-blue-100 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">Deluxe Room</p>
                    <p className="text-xs text-gray-500 font-normal italic">Private Bath • 22m²</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-blue-600">R {Math.round(displayPrice * 0.8).toLocaleString('en-ZA')}</p>
                    <p className="text-xs text-gray-500 font-normal">per month</p>
                  </div>
                </div>
              )}
              
              <div className="flex justify-center mt-1">
                <Link href={propertyLink || `#`} className="text-xs text-blue-600 hover:text-blue-600 font-medium">
                  View all {property.availableRooms} available rooms
                </Link>
              </div>
            </div>
          </div>
        )}
        
        {/* The tooltip for managers is now handled through the disabled state of the main button */}
      </div>
    </Card>
  );
}

export default PropertyCard;
