"use client"

import type { ImageLoaderProps } from "next/image"
import { Bath, BedDouble, Heart, Home, MapPin, Ruler, Star } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface ModernPropertyCardProps {
  property: {
    id: number
    name: string
    location: {
      address: string
      city: string
    }
    photoUrls?: string[]
    beds: number
    baths: number
    squareFeet: number
    pricePerMonth?: number
    averageRating?: number
    numberOfReviews?: number
    isPetsAllowed?: boolean
    isParkingIncluded?: boolean
    availableRooms?: number
    price?: number
  }
  isFavorite?: boolean
  onFavoriteToggle?: () => void
  showFavoriteButton?: boolean
  propertyLink?: string
  showActions?: boolean
  userRole?: "tenant" | "manager" | null
}

function ModernPropertyCard({
  property,
  isFavorite = false,
  onFavoriteToggle,
  showFavoriteButton = true,
  propertyLink,
  showActions = false,
  userRole = null,
}: ModernPropertyCardProps) {
  // Add simple debug logging just for price
  console.log("PRICE DEBUG:", {
    price: property.price,
    pricePerMonth: property.pricePerMonth,
    id: property.id,
    name: property.name
  });
  const [imgSrc, setImgSrc] = useState<string>(property.photoUrls?.[0] || "/placeholder.jpg")
  const [isHovered, setIsHovered] = useState(false)
  const [imgError, setImgError] = useState(false)

  // No custom loader needed - using Next.js built-in image optimization

  // Handle image error
  const handleImageError = () => {
    console.error(`Failed to load image: ${imgSrc}`)
    setImgError(true)
    setImgSrc("/placeholder.jpg")
  }

  return (
    <Card
      className="group overflow-hidden transition-all duration-300 hover:shadow-md bg-white dark:bg-slate-950 md:ml-[1.8rem] border border-gray-200 dark:border-[#333] rounded-lg relative h-[180px] w-full max-w-lg mx-auto"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex h-full">
        {/* Property image - left side with padding */}
        <div className="w-2/5 h-full p-2">
          <div className="relative w-full h-full rounded-lg overflow-hidden">
            {!imgError ? (
              <Image
                src={imgSrc || "/placeholder.svg"}
                alt={property.name}
                fill
                className={`object-cover transition-transform duration-500 ${isHovered ? "scale-105" : "scale-100"}`}
                onError={handleImageError}
                sizes="(max-width: 768px) 40vw, 160px"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-900 rounded-lg">
                <Home className="h-10 w-10 text-gray-400 dark:text-gray-600" />
              </div>
            )}

            {/* Price tag */}
            <div className="absolute top-2 left-2 z-20">
              <div className="bg-blue-600 backdrop-blur-md text-white px-2 py-1 rounded text-xs flex items-center shadow-sm border border-blue-700">
                <span className="font-bold">
                  {property.price || property.pricePerMonth ? `R${property.price || property.pricePerMonth}` : "Price on request"}
                </span>
                <span className="text-[10px] text-white/90 ml-1">/mo</span>
              </div>
            </div>

            {/* Favorite button */}
            {showFavoriteButton && (
              <Button
                size="icon"
                variant="ghost"
                className={`absolute top-2 right-2 h-6 w-6 rounded-full p-0 z-20 transition-all duration-300 ${
                  isFavorite
                    ? "bg-[#0F1112]/80 text-red-500 shadow-sm border border-red-500/50"
                    : "bg-[#0F1112]/80 text-white/80 backdrop-blur-sm border border-[#333] shadow-sm"
                }`}
                onClick={(e) => {
                  e.preventDefault()
                  onFavoriteToggle?.()
                }}
                title={isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart
                  className={`h-3 w-3 transition-all duration-300 ${isFavorite ? "fill-red-500 scale-110" : ""}`}
                />
                <span className="sr-only">Toggle favorite</span>
              </Button>
            )}
          </div>
        </div>

        {/* Property details - right side */}
        <div className="flex-1 flex flex-col justify-between p-3">
          <div>
            <Link href={propertyLink || `/properties/${property.id}`} scroll={false} className="block">
              <h2 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1 mb-0.5">
                {property.name}
              </h2>
            </Link>

            <div className="flex items-center text-sm text-gray-700 dark:text-white/80 mb-1">
              <MapPin className="h-3 w-3 mr-1 flex-shrink-0 text-gray-500 dark:text-gray-400" />
              <p className="line-clamp-1 text-[10px]">
                {property.location.address}, {property.location.city}
              </p>
            </div>

            <div className="flex gap-2">
              <div className="flex items-center text-[10px] text-gray-700 dark:text-white/80">
                <BedDouble className="h-3 w-3 mr-0.5 text-blue-500 dark:text-blue-400" />
                <span>{property.beds}</span>
              </div>

              <div className="flex items-center text-[10px] text-gray-700 dark:text-white/80">
                <Bath className="h-3 w-3 mr-0.5 text-blue-500 dark:text-blue-400" />
                <span>{property.baths}</span>
              </div>

              <div className="flex items-center text-[10px] text-gray-700 dark:text-white/80">
                <Ruler className="h-3 w-3 mr-0.5 text-blue-500 dark:text-blue-400" />
                <span>{property.squareFeet} sq ft</span>
              </div>
            </div>
          </div>

          {property.averageRating && (
            <div className="flex items-center mt-1 text-[10px]">
              <div className="flex items-center">
                <Star className="h-3 w-3 mr-0.5 text-yellow-400 fill-yellow-400" />
                <span className="text-gray-900 dark:text-white/90 font-medium">
                  {property.averageRating.toFixed(1)}
                </span>
              </div>
              {property.numberOfReviews && (
                <span className="text-[10px] text-gray-500 dark:text-white/60 ml-1">({property.numberOfReviews})</span>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

export default ModernPropertyCard
