"use client"

import type { ImageLoaderProps } from "next/image"
import { Bath, BedDouble, Heart, Home, MapPin, Ruler, Star } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
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
    pricePerMonth: number
    averageRating?: number
    numberOfReviews?: number
    isPetsAllowed?: boolean
    isParkingIncluded?: boolean
    availableRooms?: number
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
  const [imgSrc, setImgSrc] = useState<string>(property.photoUrls?.[0] || "/placeholder.jpg")
  const [isHovered, setIsHovered] = useState(false)
  const [imgError, setImgError] = useState(false)

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

  return (
    <Card
      className="group overflow-hidden transition-all duration-300 hover:shadow-xl bg-white dark:bg-[#0F1112] border border-gray-200 dark:border-[#333] rounded-xl relative h-full w-full max-w-4xl mx-auto"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex flex-col md:flex-row h-full">
        {/* Property image - left side with larger aspect ratio */}
        <div className="relative w-full md:w-3/5 aspect-[4/3]">
          {!imgError ? (
            <Image
              src={imgSrc}
              alt={property.name}
              fill
              loader={loaderFunc}
              unoptimized={true}
              className={`object-cover transition-transform duration-500 ${isHovered ? "scale-110" : "scale-100"}`}
              onError={handleImageError}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-900">
              <Home className="h-16 w-16 text-gray-400 dark:text-gray-600" />
            </div>
          )}

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

          {/* Price tag */}
          <div className="absolute top-3 left-3 z-20">
            <div className="bg-blue-600 backdrop-blur-md text-white px-3 py-1.5 rounded-md flex items-center shadow-lg border border-blue-700">
              <span className="font-bold">
                R{property.pricePerMonth.toLocaleString('en-ZA')}
              </span>
              <span className="text-xs text-white/90 ml-1">/mo</span>
            </div>
          </div>

          {/* Badges */}
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-2 z-20">
            {property.isPetsAllowed && (
              <Badge className="bg-white/90 text-gray-800 text-xs font-medium backdrop-blur-sm border border-gray-200">
                Pets Allowed
              </Badge>
            )}
            {property.isParkingIncluded && (
              <Badge className="bg-white/90 text-gray-800 text-xs font-medium backdrop-blur-sm border border-gray-200">
                Parking
              </Badge>
            )}
          </div>
          
          {/* Favorite button */}
          {showFavoriteButton && (
            <Button
              size="icon"
              variant="ghost"
              className={`absolute top-3 right-3 h-8 w-8 rounded-full p-0 z-20 transition-all duration-300 ${
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
              <Heart className={`h-4 w-4 transition-all duration-300 ${isFavorite ? "fill-red-500 scale-110" : ""}`} />
              <span className="sr-only">Toggle favorite</span>
            </Button>
          )}
        </div>

        {/* Property details - right side */}
        <div className="flex-1 flex flex-col justify-between p-4 md:p-5">
          <div>
            <Link href={propertyLink || `/properties/${property.id}`} scroll={false} className="block">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 mb-2">
                {property.name}
              </h2>
            </Link>

            <div className="flex items-center text-sm text-gray-700 dark:text-white/80 mb-4">
              <MapPin className="h-4 w-4 mr-2 flex-shrink-0 text-gray-500 dark:text-gray-400" />
              <p className="line-clamp-1">
                {property.location.address}, {property.location.city}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="flex flex-col items-center justify-center p-2 rounded-md bg-gray-50 dark:bg-white/5 backdrop-blur-sm border border-gray-100 dark:border-white/10">
                <BedDouble className="h-4 w-4 mb-1 text-blue-500 dark:text-blue-400" />
                <span className="font-medium text-gray-900 dark:text-white">{property.beds}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Beds</span>
              </div>

              <div className="flex flex-col items-center justify-center p-2 rounded-md bg-gray-50 dark:bg-white/5 backdrop-blur-sm border border-gray-100 dark:border-white/10">
                <Bath className="h-4 w-4 mb-1 text-blue-500 dark:text-blue-400" />
                <span className="font-medium text-gray-900 dark:text-white">{property.baths}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Baths</span>
              </div>

              <div className="flex flex-col items-center justify-center p-2 rounded-md bg-gray-50 dark:bg-white/5 backdrop-blur-sm border border-gray-100 dark:border-white/10">
                <Ruler className="h-4 w-4 mb-1 text-blue-500 dark:text-blue-400" />
                <span className="font-medium text-gray-900 dark:text-white">
                  {property.squareFeet}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">sq ft</span>
              </div>
            </div>
          </div>

          {property.averageRating && (
            <div className="flex items-center mt-4 border-t border-gray-100 dark:border-white/10 pt-3">
              <div className="flex items-center">
                <Star className="h-4 w-4 mr-1 text-yellow-400 fill-yellow-400" />
                <span className="text-gray-900 dark:text-white/90 font-medium">{property.averageRating.toFixed(1)}</span>
              </div>
              {property.numberOfReviews && (
                <span className="text-xs text-gray-500 dark:text-white/60 ml-2">
                  ({property.numberOfReviews} reviews)
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export default ModernPropertyCard;
