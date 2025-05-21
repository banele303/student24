"use client"

import { Bath, Bed, Heart, Home, MapPin, Star } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface PropertyCardCompactProps {
  property: {
    id?: string | number
    name: string
    location?: {
      address: string
      city: string
    }
    photoUrls?: string[]
    images?: string[]
    beds: number
    baths: number
    squareFeet?: number
    pricePerMonth?: number
    price?: number
    averageRating?: number
    numberOfReviews: number
    isPetsAllowed?: boolean
    isParkingIncluded?: boolean
    availableRooms?: number
  }
  isFavorite?: boolean
  onFavoriteToggle?: () => void
  showFavoriteButton?: boolean
  propertyLink?: string
  userRole?: "tenant" | "manager" | "admin" | null
}

export default function PropertyCardCompact({
  property,
  isFavorite = false,
  onFavoriteToggle,
  showFavoriteButton = true,
  propertyLink,
  userRole = null,
}: PropertyCardCompactProps) {
  // Enhanced approach to handle multiple image sources
  const [imgSrc, setImgSrc] = useState(
    // First try images array
    property.images && property.images.length > 0 ? property.images[0] :
    // Then try photoUrls array
    property.photoUrls && property.photoUrls.length > 0 ? property.photoUrls[0] :
    // Default placeholder
    "/placeholder.svg?height=300&width=300"
  )
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Card 
      className="flex flex-row h-auto min-h-[140px] mt-6 overflow-hidden transition-all duration-300 hover:shadow-md border border-gray-200 bg-white rounded-xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image section */}
      <div className="relative h-full w-1/3 min-w-[120px]  overflow-hidden ml-3">
        <Image
          src={imgSrc || "/placeholder.svg"}
          alt={property.name}
          fill
          className={`object-cover transition-transform rounded-md duration-500 ${isHovered ? "scale-110 rounded-md" : "scale-100"}`}
          sizes="(max-width: 768px) 100vw, 33vw"
          onError={() => setImgSrc("/placeholder.svg?height=300&width=300")}
          priority
        />
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent z-10" />
        
        {/* Price tag */}
        <div className="absolute top-2 left-2 z-20">
          <div className="bg-white shadow-md text-gray-800 px-2 py-1 rounded-md flex items-center border border-gray-100">
            <span className="font-bold text-sm">
              R{(property.price || property.pricePerMonth || 0).toFixed(0)}
            </span>
            <span className="text-xs text-gray-500 ml-1">/mo</span>
          </div>
        </div>

        {/* Available rooms badge */}
        {property.availableRooms !== undefined && property.availableRooms > 0 && (
          <div className="absolute top-2 right-2 z-20">
            <Badge className="bg-green-500 text-white text-xs font-medium">
              {property.availableRooms} {property.availableRooms === 1 ? 'Room' : 'Rooms'} Available
            </Badge>
          </div>
        )}
      </div>
      
      {/* Content section */}
      <div className="relative flex w-2/3 flex-col justify-between p-3 sm:p-4 bg-white text-gray-800">
        <div className="space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h2 className="line-clamp-1 text-base font-bold sm:text-lg group-hover:text-blue-600 transition-colors">
              {propertyLink ? (
                <Link href={propertyLink} className="hover:text-blue-600" scroll={false}>
                  {property.name}
                </Link>
              ) : (
                property.name
              )}
            </h2>
            {/* Favorite button - always show it regardless of user role */}
            {showFavoriteButton && (
              <Button
                size="icon"
                variant="ghost"
                className={`h-6 w-6 shrink-0 rounded-full p-0 transition-colors ${
                  isFavorite ? "text-red-500" : "text-gray-400 hover:text-gray-700"
                } ${userRole === "manager" ? "opacity-60" : ""}`}
                onClick={onFavoriteToggle}
                title={userRole === "manager" ? "Managers cannot favorite properties" : "Add to favorites"}
                disabled={userRole === "manager"}
              >
                <Heart className={`h-4 w-4 transition-all duration-300 ${isFavorite ? "fill-red-500 scale-110" : ""}`} />
                <span className="sr-only">Toggle favorite</span>
              </Button>
            )}
          </div>
          
          <div className="flex items-center text-xs text-gray-500">
            <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
            <p className="line-clamp-1">
              {property.location ? `${property.location.address}, ${property.location.city}` : 'Location not available'}
            </p>
          </div>
          
          <div className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-md w-fit">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span className="text-xs font-medium">{(property.averageRating || 0).toFixed(1)}</span>
            <span className="text-xs text-gray-500">({property.numberOfReviews})</span>
          </div>
        </div>
        
        <div className="mt-2 flex flex-wrap items-center justify-between gap-y-2">
          <div className="flex gap-3 text-xs text-gray-600 sm:text-sm">
            <div className="flex items-center gap-1">
              <Bed className="h-3.5 w-3.5" />
              <span>{property.beds}</span>
            </div>
            <div className="flex items-center gap-1">
              <Bath className="h-3.5 w-3.5" />
              <span>{property.baths}</span>
            </div>
            <div className="flex items-center gap-1">
              <Home className="h-3.5 w-3.5" />
              <span>{property.squareFeet ? `${property.squareFeet} m²` : 'N/A'}</span>
            </div>
          </div>
          
          {/* Feature badges */}
          <div className="flex flex-wrap gap-1.5">
            {property.isPetsAllowed && (
              <Badge variant="outline" className="text-xs bg-gray-50 border-gray-200">
                Pets
              </Badge>
            )}
            {property.isParkingIncluded && (
              <Badge variant="outline" className="text-xs bg-gray-50 border-gray-200">
                Parking
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}