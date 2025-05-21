"use client";
import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useAppSelector } from "@/state/redux";
import { useGetPropertiesQuery } from "@/state/api";
import { Property } from "@/types/prismaTypes";

// Extended Property type with location and other properties needed for the map
interface PropertyWithLocation extends Property {
  location?: {
    address?: string;
    city?: string;
    state?: string;
    province?: string;
    country?: string;
    postalCode?: string;
    coordinates?: {
      longitude: number;
      latitude: number;
    };
    id: number;
  };
  availableRooms?: number;
}

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN as string;

const Map = () => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const filters = useAppSelector((state) => state.global.filters);
  const {
    data: allProperties,
    isLoading,
    isError,
  } = useGetPropertiesQuery(filters);
  
  // Filter properties to ensure they actually match the searched location
  const properties = React.useMemo<PropertyWithLocation[] | undefined>(() => {
    if (!allProperties || !filters.location) return allProperties as PropertyWithLocation[];
    
    // If no specific location is searched, show all properties
    if (filters.location === 'any') return allProperties as PropertyWithLocation[];
    
    // Normalize the searched location (remove 'South Africa' and lowercase)
    const searchedLocation = filters.location
      .replace(/,\s*south africa/i, '')
      .toLowerCase()
      .trim();
    
    // Filter properties based on location match with more strict criteria
    return (allProperties as PropertyWithLocation[]).filter(property => {
      // Get property city/address and normalize
      const propertyCity = (property.location?.city || '').toLowerCase().trim();
      const propertyAddress = (property.location?.address || '').toLowerCase().trim();
      const propertyProvince = (property.location?.province || '').toLowerCase().trim();
      
      // For exact city matching
      if (propertyCity === searchedLocation) {
        return true;
      }
      
      // For neighborhood/suburb/township within a city
      // Only match if the city explicitly contains the neighborhood or vice versa
      if (propertyCity.includes(' ' + searchedLocation) || 
          propertyCity.includes(searchedLocation + ' ') ||
          searchedLocation.includes(' ' + propertyCity) ||
          searchedLocation.includes(propertyCity + ' ')) {
        return true;
      }
      
      // Match addresses but require the match to be a complete word or phrase
      const addressWords = propertyAddress.split(/\s+|,/);
      const searchWords = searchedLocation.split(/\s+|,/);
      
      // Check if the address contains all search words in sequence
      const addressMatch = searchWords.every(word => 
        word.length > 2 && propertyAddress.includes(word)
      );
      
      // Exclude properties that don't match the correct city/province
      // This prevents showing Johannesburg properties when searching for Pretoria
      const incorrectCityMatch = 
        (searchedLocation.includes('pretoria') && propertyCity.includes('johannesburg')) ||
        (searchedLocation.includes('johannesburg') && propertyCity.includes('pretoria'));
      
      if (incorrectCityMatch) {
        return false;
      }
      
      return addressMatch;
    });
  }, [allProperties, filters.location]) as PropertyWithLocation[] | undefined;

  useEffect(() => {
    if (isLoading || isError || !properties) return;

    // South African map boundaries (to make sure we stay within South Africa)
    const southAfricaBoundingBox = {
      minLng: 16.3, // western-most point of South Africa
      maxLng: 33.0, // eastern-most point of South Africa
      minLat: -35.0, // southern-most point
      maxLat: -22.0, // northern-most point
    };

    // Default coordinates for South Africa (Johannesburg)
    const defaultCoordinates: [number, number] = [28.0473, -26.2041];
    
    // Validate coordinates to ensure they're valid numbers within South Africa's range
    let validCoordinates: [number, number];
    if (
      filters.coordinates && 
      Array.isArray(filters.coordinates) && 
      filters.coordinates.length === 2 &&
      typeof filters.coordinates[0] === 'number' && 
      typeof filters.coordinates[1] === 'number' &&
      filters.coordinates[0] >= southAfricaBoundingBox.minLng && 
      filters.coordinates[0] <= southAfricaBoundingBox.maxLng &&
      filters.coordinates[1] >= southAfricaBoundingBox.minLat && 
      filters.coordinates[1] <= southAfricaBoundingBox.maxLat
    ) {
      validCoordinates = filters.coordinates;
      console.log("Using filtered coordinates:", validCoordinates);
    } else {
      validCoordinates = defaultCoordinates;
      console.log("Using default South Africa coordinates:", validCoordinates);
    }
    
    // Clean up existing markers first to avoid duplicates
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Initialize map if it doesn't exist, otherwise just update properties
    if (!mapRef.current) {
      try {
        console.log("Creating new map with center:", validCoordinates);
        mapRef.current = new mapboxgl.Map({
          container: mapContainerRef.current!,
          style: "mapbox://styles/alexbsibanda/cm9r6ojpt008m01s046hwhlbp",
          center: validCoordinates,
          zoom: 9, // Use a wider view to show more of the neighborhood/city (like Centurion)
          maxBounds: [
            [southAfricaBoundingBox.minLng, southAfricaBoundingBox.minLat], // Southwest
            [southAfricaBoundingBox.maxLng, southAfricaBoundingBox.maxLat]  // Northeast
          ],
        });
        
        // Add navigation controls
        mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
        
        // Add event listener to map load
        mapRef.current.on('load', () => {
          console.log("Map loaded");
          resizeMap();
        });
      } catch (err) {
        console.error("Error creating map:", err);
      }
    } else {
      // Update existing map's center
      console.log("Updating existing map to center:", validCoordinates);
      mapRef.current.flyTo({
        center: validCoordinates,
        zoom: 11,
        speed: 1.5,
        curve: 1.5,
      });
    }

    // Wait a bit for the map to be fully initialized before adding markers
    setTimeout(() => {
      if (mapRef.current && properties.length > 0) {
        // Collect all valid property coordinates to calculate viewport
        const validPropertyCoordinates: [number, number][] = [];
        
        // Add markers for properties
        properties.forEach((property: Property) => {
          try {
            if (property.location?.coordinates?.longitude && property.location?.coordinates?.latitude) {
              const lng = property.location.coordinates.longitude;
              const lat = property.location.coordinates.latitude;
              
              // Only create markers for properties within South Africa boundaries
              if (
                lng >= southAfricaBoundingBox.minLng && 
                lng <= southAfricaBoundingBox.maxLng &&
                lat >= southAfricaBoundingBox.minLat && 
                lat <= southAfricaBoundingBox.maxLat
              ) {
                const marker = createPropertyMarker(property, mapRef.current!);
                if (marker) {
                  // Store the marker for future cleanup
                  markersRef.current.push(marker);
                  
                  // Collect valid coordinates for viewport calculation
                  validPropertyCoordinates.push([lng, lat]);
                  
                  // Style the marker
                  const markerElement = marker.getElement();
                  const path = markerElement.querySelector("path[fill='#3FB1CE']");
                  if (path) path.setAttribute("fill", "#3366FF"); // Blue marker color
                }
              } else {
                console.warn(`Property ${property.id} has coordinates outside South Africa:`, [lng, lat]);
              }
            }
          } catch (err) {
            console.error(`Error creating marker for property ${property.id}:`, err);
          }
        });
        
        // If we have valid properties, fit the map to show all of them
        if (validPropertyCoordinates.length > 0) {
          // If we have only one property or all properties are in the same location,
          // just center on that location with higher zoom
          if (validPropertyCoordinates.length === 1) {
            mapRef.current.flyTo({
              center: validPropertyCoordinates[0],
              zoom: 14, // Higher zoom for single property
              speed: 1.5,
            });
          } else {
            // Create a bounding box that contains all properties
            const bounds = validPropertyCoordinates.reduce((box, coord) => {
              return box.extend(new mapboxgl.LngLat(coord[0], coord[1]));
            }, new mapboxgl.LngLatBounds(validPropertyCoordinates[0], validPropertyCoordinates[0]));
            
            // Fit the map to show all properties with some padding
            mapRef.current.fitBounds(bounds, {
              padding: 50, // Padding around bounds
              maxZoom: 15, // Don't zoom in too far
              duration: 1000, // Animation duration
            });
          }
        }
      }
    }, 300); // Short delay to ensure map is ready

    const resizeMap = () => {
      if (mapRef.current) setTimeout(() => mapRef.current?.resize(), 300);
    };
    
    // Handle window resize
    window.addEventListener('resize', resizeMap);
    
    // Return cleanup function
    return () => {
      window.removeEventListener('resize', resizeMap);
      if (mapRef.current && !mapRef.current.isStyleLoaded()) {
        mapRef.current.remove();
        mapRef.current = null;
        markersRef.current = [];
      }
    };
  }, [isLoading, isError, properties, filters.coordinates, filters.location]);

  if (isLoading) return (
    <div className="hidden pt-5 md:block md:basis-6/12 grow relative rounded-xl flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-center text-gray-600 dark:text-gray-300">Loading map...</p>
      </div>
    </div>
  );

  if (isError || !properties) return (
    <div className="hidden pt-5 md:block md:basis-6/12 grow relative rounded-xl flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <p className="text-center text-red-500 font-medium">Failed to load map data</p>
      </div>
    </div>
  );

  // Check if we have any properties with valid coordinates
  const hasValidProperties = properties.some(property => 
    property.location?.coordinates?.longitude && 
    property.location?.coordinates?.latitude
  );

  return (
    <div className="hidden pt-5 md:block md:basis-6/12 grow relative rounded-xl">
      <div
        className="map-container rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
        ref={mapContainerRef}
        style={{
          height: "100%",
          width: "100%",
          maxHeight: "calc(100vh - 250px)"
        }}
      />
      
      {/* Overlay message when no properties found for location */}
      {properties.length === 0 && filters.location && filters.location !== 'any' && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl z-10">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md max-w-md text-center">
            <div className="text-blue-500 p-3 bg-blue-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Properties in {filters.location}</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              We couldn&apos;t find any properties in this location. The map is showing the searched area, but there are currently no listings available here.
            </p>
          </div>
        </div>
      )}
      
      {/* Message for when no properties have valid coordinates */}
      {properties.length > 0 && !hasValidProperties && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl z-10">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md max-w-md text-center">
            <p className="text-amber-600 dark:text-amber-500 font-medium">
              Properties found, but location data is missing or invalid.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const createPropertyMarker = (property: PropertyWithLocation, map: mapboxgl.Map) => {
  // Validate property coordinates before creating marker
  if (!property.location?.coordinates?.longitude || !property.location?.coordinates?.latitude) {
    console.error(`Property ${property.id} has invalid coordinates`);
    return null;
  }
  
  // Check if coordinates are within valid ranges
  const lng = property.location.coordinates.longitude;
  const lat = property.location.coordinates.latitude;
  
  // South African boundaries check
  const southAfricaBoundingBox = {
    minLng: 16.3, // western-most point of South Africa
    maxLng: 33.0, // eastern-most point of South Africa
    minLat: -35.0, // southern-most point
    maxLat: -22.0, // northern-most point
  };
  
  if (
    lng < southAfricaBoundingBox.minLng || 
    lng > southAfricaBoundingBox.maxLng || 
    lat < southAfricaBoundingBox.minLat || 
    lat > southAfricaBoundingBox.maxLat
  ) {
    console.error(`Property ${property.id} has coordinates outside South Africa: [${lng}, ${lat}]`);
    return null;
  }
  
  try {
    // Format price in South African Rands with thousands separator
    const formattedPrice = property.price ? property.price.toLocaleString('en-ZA') : 'N/A';
    
    // Determine if we have available rooms to display
    const availableRoomsText = property.availableRooms 
      ? `<div class="mt-1 text-sm"><span class="font-medium">${property.availableRooms}</span> room${property.availableRooms > 1 ? 's' : ''} available</div>` 
      : '';
    
    // Property features
    const features = [];
    if (property.beds) features.push(`${property.beds} beds`);
    if (property.baths) features.push(`${property.baths} baths`);
    if (property.squareFeet) features.push(`${property.squareFeet}m²`);
    
    const featuresText = features.length > 0 
      ? `<div class="text-xs text-gray-500 mt-1">${features.join(' • ')}</div>` 
      : '';
    
    // Location info
    const locationText = property.location?.city 
      ? `<div class="text-xs text-gray-500 mt-1">${property.location.city}, South Africa</div>` 
      : '';
    
    const marker = new mapboxgl.Marker({
      color: '#3366FF',
    })
      .setLngLat([lng, lat])
      .setPopup(
        new mapboxgl.Popup({
          offset: 25,
          closeButton: false,
          className: 'property-popup'
        }).setHTML(
          `
          <div class="p-2 max-w-[240px]">
            <div class="font-medium text-blue-800 mb-1 text-sm">
              <a href="/search/${property.id}" class="hover:text-blue-600 hover:underline">${property.name}</a>
            </div>
            
            <div class="font-bold text-base text-blue-600">R ${formattedPrice}<span class="text-xs font-normal text-gray-500"> / month</span></div>
            
            ${featuresText}
            ${locationText}
            ${availableRoomsText}
            
            <div class="mt-2 pt-1 border-t border-gray-200">
              <a href="/search/${property.id}" class="text-xs text-blue-500 hover:text-blue-700 hover:underline font-medium">View details</a>
            </div>
          </div>
          `
        )
      )
      .addTo(map);
    
    // Add CSS to the document head for styling the popup
    if (!document.getElementById('map-popup-styles')) {
      const style = document.createElement('style');
      style.id = 'map-popup-styles';
      style.innerHTML = `
        .property-popup .mapboxgl-popup-content {
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          padding: 0;
          overflow: hidden;
          font-family: system-ui, -apple-system, sans-serif;
        }
        .property-popup .mapboxgl-popup-tip {
          border-top-color: white;
        }
        @media (prefers-color-scheme: dark) {
          .property-popup .mapboxgl-popup-content {
            background: #1f2937;
            color: #f3f4f6;
          }
          .property-popup .mapboxgl-popup-tip {
            border-top-color: #1f2937;
          }
          .property-popup a {
            color: #3b82f6 !important;
          }
          .property-popup .text-blue-800, .property-popup .text-blue-600, .property-popup .text-gray-500 {
            color: #93c5fd !important;
          }
          .property-popup .text-gray-500 {
            color: #9ca3af !important;
          }
          .property-popup .border-gray-200 {
            border-color: #374151 !important;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    return marker;
  } catch (err) {
    console.error(`Error creating marker for property ${property.id}:`, err);
    return null;
  }
};

export default Map;