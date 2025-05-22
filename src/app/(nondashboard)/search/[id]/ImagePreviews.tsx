"use client";

import { ChevronLeft, ChevronRight, Home } from "lucide-react";
import Image, { ImageLoaderProps } from "next/image";
import React, { useState } from "react";

const ImagePreviews = ({ images }: ImagePreviewsProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  // Enhanced approach to handle multiple image sources (directly from CardCompact component)
  const [imgSrc, setImgSrc] = useState<string[]>(
    // First try images array 
    Array.isArray(images) && images.length > 0 ? 
      images.filter(img => img && img.trim() !== '') : 
      []
  );
  
  // Custom loader that just returns the URL as-is (same as CardCompact)
  const loaderFunc = ({ src }: ImageLoaderProps) => {
    return src;
  };
  
  // Handle image error for specific index
  const handleImageError = (index: number) => {
    console.error(`Failed to load image at index ${index}`);
    // Replace the failed image with placeholder (exactly as in CardCompact)
    if (imgSrc.length > index) {
      const newImgSrc = [...imgSrc];
      newImgSrc[index] = "/placeholder.svg";
      setImgSrc(newImgSrc);
    }
  };

  const handlePrev = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="relative h-[350px] md:h-[400px] lg:h-[400px] xl:h-[450px] w-full max-w-5xl mx-auto mt-6 pt-4 pb-2 px-2">
      {imgSrc.length === 0 ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 rounded-lg">
          <Home className="h-16 w-16 text-gray-400" />
          <p className="text-gray-500 mt-4">No images available</p>
        </div>
      ) : (
        imgSrc.map((image, index) => (
          <div
            key={`image-${index}`}
            className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
              index === currentImageIndex ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={image || "/placeholder.svg"}
              alt={`Property Image ${index + 1}`}
              fill
              loader={loaderFunc}
              unoptimized={true}
              priority={index === 0}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1000px"
              className="object-cover cursor-pointer transition-transform duration-500 ease-in-out rounded-lg shadow-md"
              onError={() => handleImageError(index)}
            />
          </div>
        ))
      )}
      <button
        onClick={handlePrev}
        className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-primary-700 bg-opacity-50 p-2 rounded-full focus:outline-none focus:ring focus:ring-secondary-300"
        aria-label="Previous image"
      >
        <ChevronLeft className="text-white" />
      </button>
      <button
        onClick={handleNext}
        className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-primary-700 bg-opacity-50 p-2 rounded-full focus:outline-none focus:ring focus:ring-secondary-300"
        aria-label="Previous image"
      >
        <ChevronRight className="text-white" />
      </button>
    </div>
  );
};

export default ImagePreviews;