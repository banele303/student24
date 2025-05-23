// Custom type definitions for Prisma models
// These match the structure of your Prisma schema

// Manager model
export interface Manager {
  id: number;
  cognitoId: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string; // Add name field to match usage in the code
  phoneNumber?: string;
  profileImageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Tenant model
export interface Tenant {
  id: number;
  cognitoId: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string; // Add name field to match usage in the code
  phoneNumber?: string;
  profileImageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  favorites?: any[];
}

// Application Status enum
export enum ApplicationStatus {
  Pending = 'Pending',
  Denied = 'Denied',
  Approved = 'Approved'
}

// Application model
export interface Application {
  id: number;
  tenantCognitoId: string;
  propertyId: number;
  applicationDate: string | Date;
  status: ApplicationStatus;
  moveInDate?: string | Date;
  createdAt: Date;
  updatedAt: Date;
  // Related models
  property?: any;
  tenant?: Tenant;
}

// Property model
export interface Property {
  id: number;
  name: string;
  description?: string;
  propertyType?: string;
  price: number;
  securityDeposit?: number;
  applicationFee?: number;
  beds: number;
  baths: number;
  squareFeet?: number;
  locationId?: number;
  isAvailable: boolean;
  images?: string[];
  photoUrls?: string[];
  // Ratings and reviews
  averageRating?: number;
  numberOfReviews?: number;
  // Property features
  isPetsAllowed?: boolean;
  isParkingIncluded?: boolean;
  amenities?: string[];
  highlights?: string[];
  // Related models
  location?: any;
  leases?: any[];
}

// Lease model
export interface Lease {
  id: number;
  tenantCognitoId: string;
  propertyId: number;
  startDate: string | Date;
  endDate: string | Date;
  status: string;
  monthlyRent: number;
  securityDeposit?: number;
  createdAt: Date;
  updatedAt: Date;
  tenant: {
    phoneNumber: string;
    name?: string;
    email?: string;
  };
  rent: number; // Adding this property as it's used in the component
}

// Payment model
export interface Payment {
  id: number;
  leaseId: number;
  amount: number;
  date: string | Date;
  status: string;
  paymentMethod?: string;
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
  // Related models
  lease?: Lease;
}

// Room model
export interface Room {
  id: number;
  propertyId: number;
  name: string;
  description?: string;
  roomType: string;
  pricePerMonth: number;
  securityDeposit?: number;
  squareFeet?: number;
  isAvailable: boolean;
  availableFrom?: Date | string | null;
  capacity: number;
  amenities?: string[];
  features?: string[];
  photoUrls?: string[];
  createdAt: Date;
  updatedAt: Date;
  // Related models
  property?: Property;
}

// Other types can be added as needed
