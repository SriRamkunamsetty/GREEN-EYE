// Shared Data Types for GREEN EYE Smart Waste Platform

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'citizen' | 'municipality' | 'recycler' | 'collection' | 'admin';
  points: number;
  badges: string[];
}

export type WasteCategory =
  | 'Plastic'
  | 'Paper'
  | 'Glass'
  | 'Metal'
  | 'Organic'
  | 'E-Waste'
  | 'Hazardous'
  | 'Medical';

export interface WasteItem {
  id: string;
  citizenId: string;
  object: string;
  category: WasteCategory;
  confidence: number;
  recyclable: boolean;
  carbonSavedKg: number;
  timestamp: string;
  disposalMethod: string;
  recyclingCenterName?: string;
  recyclingCenterDistance?: string;
}

export interface SmartBin {
  id: string;
  name: string;
  locationName: string;
  latitude: number;
  longitude: number;
  fillLevel: number; // 0 to 100
  weightKg: number;
  temperatureC: number;
  gasConcentrationPpm: number;
  lastUpdated: string;
  status: 'Normal' | 'Warning' | 'Critical';
  predictionCollectHrs: number;
}

export interface PickupRequest {
  id: string;
  citizenId: string;
  citizenName: string;
  materials: string; // e.g., "15kg Cardboard, 3 Old Batteries"
  estimatedWeightKg: number;
  status: 'Pending' | 'Scheduled' | 'Assigned' | 'Collected';
  scheduledTime: string;
  address: string;
  latitude: number;
  longitude: number;
  pointsAwarded: number;
}

export interface CollectionRoute {
  id: string;
  routeName: string;
  driverName: string;
  binIds: string[];
  stopsCount: number;
  totalDistanceKm: number;
  estimatedTimeMin: number;
  status: 'Ready' | 'In Progress' | 'Completed';
  optimizeAlgo: 'A*' | 'Dijkstra' | 'VRP';
  points: Array<{ lat: number; lng: number; order: number; name: string }>;
}

export interface DumpingAlert {
  id: string;
  reportedBy: string;
  locationName: string;
  latitude: number;
  longitude: number;
  imageUrl?: string;
  status: 'Unresolved' | 'Investigating' | 'Cleared';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  description: string;
  reportTime: string;
}

export interface MarketplaceListing {
  id: string;
  sellerId: string;
  sellerName: string;
  title: string;
  materialType: string;
  category: WasteCategory;
  estimatedWeightKg: number;
  askingPriceCredits: number;
  status: 'Available' | 'Pending' | 'Sold';
  description: string;
  timestamp: string;
  coordinates: { lat: number; lng: number };
}

export interface MarketplaceTransaction {
  id: string;
  listingId: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  priceCredits: number;
  timestamp: string;
}

export interface SystemMetrics {
  totalWasteCollectedKg: number;
  recyclingRatePercent: number;
  carbonReducedKg: number;
  landfillReductionPercent: number;
  smartBinsCount: number;
  citizenRewardsDistributed: number;
  activeRoutesCount: number;
}

export interface PredictionData {
  dailyGenerations: Array<{ day: string; predictedKgs: number; type: string }>;
  weeklyTotals: Array<{ week: string; predictedKgs: number }>;
  categoriesRatio: Array<{ category: string; value: number }>;
}
