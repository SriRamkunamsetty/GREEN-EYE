import fs from 'fs';
import path from 'path';
import { 
  SmartBin, 
  PickupRequest, 
  CollectionRoute, 
  DumpingAlert, 
  MarketplaceListing, 
  MarketplaceTransaction, 
  WasteItem, 
  SystemMetrics,
  User
} from '../src/types';

const STORE_PATH = path.join(process.cwd(), 'data-store.json');

// Preloaded mock data for first-time setup
const INITIAL_USERS: User[] = [
  {
    id: 'user-citizen',
    email: 'mohansriramkunamsetty@gmail.com',
    name: 'Mohan Sriram',
    role: 'citizen',
    points: 1250,
    badges: ['Recycling Champion', 'Eco Guardian']
  },
  {
    id: 'user-muni',
    email: 'muni@greeneye.gov',
    name: 'Director of Waste Services',
    role: 'municipality',
    points: 0,
    badges: []
  },
  {
    id: 'user-recycler',
    email: 'recycling@ecopro.com',
    name: 'EcoPro Recycling Ltd',
    role: 'recycler',
    points: 8000,
    badges: []
  },
  {
    id: 'user-driver',
    email: 'driver@greeneye.gov',
    name: 'Marcus Vance',
    role: 'collection',
    points: 0,
    badges: []
  }
];

const INITIAL_BINS: SmartBin[] = [
  {
    id: 'bin-001',
    name: 'Down Town Hub A',
    locationName: 'Oak St. & 4th Ave',
    latitude: 37.7749,
    longitude: -122.4194,
    fillLevel: 82,
    weightKg: 24.5,
    temperatureC: 22,
    gasConcentrationPpm: 250,
    lastUpdated: new Date().toISOString(),
    status: 'Warning',
    predictionCollectHrs: 4
  },
  {
    id: 'bin-002',
    name: 'Financial Sq. B',
    locationName: 'Market St. & Front St',
    latitude: 37.7894,
    longitude: -122.4014,
    fillLevel: 94,
    weightKg: 38.2,
    temperatureC: 26,
    gasConcentrationPpm: 450,
    lastUpdated: new Date().toISOString(),
    status: 'Critical',
    predictionCollectHrs: 1
  },
  {
    id: 'bin-003',
    name: 'Marina District Smart',
    locationName: 'Lombard St. & Fillmore',
    latitude: 37.8014,
    longitude: -122.4354,
    fillLevel: 45,
    weightKg: 12.0,
    temperatureC: 19,
    gasConcentrationPpm: 90,
    lastUpdated: new Date().toISOString(),
    status: 'Normal',
    predictionCollectHrs: 22
  },
  {
    id: 'bin-004',
    name: 'SOMA Tech Plaza',
    locationName: 'Howard St. & 2nd Ave',
    latitude: 37.7854,
    longitude: -122.3994,
    fillLevel: 15,
    weightKg: 4.1,
    temperatureC: 18,
    gasConcentrationPpm: 45,
    lastUpdated: new Date().toISOString(),
    status: 'Normal',
    predictionCollectHrs: 36
  },
  {
    id: 'bin-005',
    name: 'Mission Cultural Hub',
    locationName: 'Valencia St. & 16th St',
    latitude: 37.7648,
    longitude: -122.4211,
    fillLevel: 88,
    weightKg: 31.0,
    temperatureC: 41, // Temp spike
    gasConcentrationPpm: 510,
    lastUpdated: new Date().toISOString(),
    status: 'Critical',
    predictionCollectHrs: 2
  }
];

const INITIAL_PICKUPS: PickupRequest[] = [
  {
    id: 'pickup-1',
    citizenId: 'user-citizen',
    citizenName: 'Mohan Sriram',
    materials: '30kg PET Plastic, 12 Old Lead-Acid Batteries',
    estimatedWeightKg: 42,
    status: 'Scheduled',
    scheduledTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    address: '888 Brannan St, San Francisco, CA',
    latitude: 37.7719,
    longitude: -122.4044,
    pointsAwarded: 150
  },
  {
    id: 'pickup-2',
    citizenId: 'user-citizen',
    citizenName: 'Sarah Conner',
    materials: '120kg Mixed Cardboard and Office Paper',
    estimatedWeightKg: 120,
    status: 'Pending',
    scheduledTime: new Date(Date.now() + 172800000).toISOString(),
    address: '50 Main St, San Francisco, CA',
    latitude: 37.7932,
    longitude: -122.3962,
    pointsAwarded: 350
  }
];

const INITIAL_ROUTES: CollectionRoute[] = [
  {
    id: 'route-north',
    routeName: 'Route Alpha: North-SOMA Collect',
    driverName: 'Marcus Vance',
    binIds: ['bin-001', 'bin-002', 'bin-005'],
    stopsCount: 4,
    totalDistanceKm: 14.2,
    estimatedTimeMin: 45,
    status: 'Ready',
    optimizeAlgo: 'VRP',
    points: [
      { lat: 37.7719, lng: -122.4044, order: 0, name: 'Depot Start' },
      { lat: 37.7648, lng: -122.4211, order: 1, name: 'Mission Cultural Hub (bin-005)' },
      { lat: 37.7749, lng: -122.4194, order: 2, name: 'Down Town Hub A (bin-001)' },
      { lat: 37.7894, lng: -122.4014, order: 3, name: 'Financial Sq. B (bin-002)' },
      { lat: 37.7719, lng: -122.4044, order: 4, name: 'Recycling Processing Depot (End)' }
    ]
  },
  {
    id: 'route-west',
    routeName: 'Route Beta: Marina Circle',
    driverName: 'Dave Batista',
    binIds: ['bin-003', 'bin-004'],
    stopsCount: 3,
    totalDistanceKm: 18.5,
    estimatedTimeMin: 55,
    status: 'Completed',
    optimizeAlgo: 'A*',
    points: [
      { lat: 37.7719, lng: -122.4044, order: 0, name: 'Depot Start' },
      { lat: 37.8014, lng: -122.4354, order: 1, name: 'Marina District Smart (bin-003)' },
      { lat: 37.7854, lng: -122.3994, order: 2, name: 'SOMA Tech Plaza (bin-004)' },
      { lat: 37.7719, lng: -122.4044, order: 3, name: 'Recycling Processing Depot (End)' }
    ]
  }
];

const INITIAL_ALERTS: DumpingAlert[] = [
  {
    id: 'alert-101',
    reportedBy: 'Citizen Scout',
    locationName: 'Alleyway behind 14th St Market',
    latitude: 37.7679,
    longitude: -122.4255,
    status: 'Unresolved',
    severity: 'High',
    description: 'Bulk construction debris, concrete bags, and tires left overnight.',
    reportTime: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
  },
  {
    id: 'alert-102',
    reportedBy: 'AI CCTV Alert #204',
    locationName: 'Pierside Parking Area B',
    latitude: 37.8088,
    longitude: -122.4102,
    status: 'Investigating',
    severity: 'Critical',
    description: 'Autonomous camera detected unauthorized box vehicle discharge of electronic scrap.',
    reportTime: new Date(Date.now() - 14400000).toISOString() // 4 hours ago
  }
];

const INITIAL_LISTINGS: MarketplaceListing[] = [
  {
    id: 'list-001',
    sellerId: 'user-citizen',
    sellerName: 'Mohan Sriram',
    title: 'Clean Compressed Cardboard Bundles',
    materialType: 'Corrugated Cardboard',
    category: 'Paper',
    estimatedWeightKg: 85,
    askingPriceCredits: 250,
    status: 'Available',
    description: 'Dry, heavy post-consumer corrugated boards gathered in clean conditions. Ready for freight collection.',
    timestamp: new Date().toISOString(),
    coordinates: { lat: 37.7749, lng: -122.4194 }
  },
  {
    id: 'list-002',
    sellerId: 'citizen-sarah',
    sellerName: 'Sarah Jenkins',
    title: 'Flaked High-Density Polyethylene',
    materialType: 'HDPE Colored Shreds',
    category: 'Plastic',
    estimatedWeightKg: 210,
    askingPriceCredits: 950,
    status: 'Available',
    description: 'Sorted, shredded HDPE bottle caps and milk bottles. Washed twice, pure stream of recyclable thermoplastic.',
    timestamp: new Date(Date.now() - 36000000).toISOString(),
    coordinates: { lat: 37.7854, lng: -122.3994 }
  }
];

const INITIAL_WASTE_ITEMS: WasteItem[] = [
  {
    id: 'item-1',
    citizenId: 'user-citizen',
    object: 'Coca Cola Aluminum Can',
    category: 'Metal',
    confidence: 96.8,
    recyclable: true,
    carbonSavedKg: 0.85,
    timestamp: new Date().toISOString(),
    disposalMethod: 'Wash aluminum can, deposit into the Blue Bin. Limit moisture.',
    recyclingCenterName: 'Downtown Metal Recyclers',
    recyclingCenterDistance: '1.4km'
  },
  {
    id: 'item-2',
    citizenId: 'user-citizen',
    object: 'Styrofoam Meal Container',
    category: 'Hazardous',
    confidence: 99.2,
    recyclable: false,
    carbonSavedKg: 0,
    timestamp: new Date(Date.now() - 4000000).toISOString(),
    disposalMethod: 'Styrofoam (expanded polystyrene) is non-recyclable in standard municipal lines. Place in regular landfills refuse or contact special treatment depots.',
    recyclingCenterName: 'West Valley Scrap Management',
    recyclingCenterDistance: '6.8km'
  }
];

const INITIAL_METRICS: SystemMetrics = {
  totalWasteCollectedKg: 45290,
  recyclingRatePercent: 74.2,
  carbonReducedKg: 52400,
  landfillReductionPercent: 68.5,
  smartBinsCount: 5,
  citizenRewardsDistributed: 15400,
  activeRoutesCount: 1
};

export class Database {
  users: User[] = [];
  bins: SmartBin[] = [];
  pickups: PickupRequest[] = [];
  routes: CollectionRoute[] = [];
  alerts: DumpingAlert[] = [];
  listings: MarketplaceListing[] = [];
  wasteItems: WasteItem[] = [];
  metrics: SystemMetrics = INITIAL_METRICS;
  transactions: MarketplaceTransaction[] = [];

  constructor() {
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(STORE_PATH)) {
        const raw = fs.readFileSync(STORE_PATH, 'utf-8');
        const data = JSON.parse(raw);
        this.users = data.users || INITIAL_USERS;
        this.bins = data.bins || INITIAL_BINS;
        this.pickups = data.pickups || INITIAL_PICKUPS;
        this.routes = data.routes || INITIAL_ROUTES;
        this.alerts = data.alerts || INITIAL_ALERTS;
        this.listings = data.listings || INITIAL_LISTINGS;
        this.wasteItems = data.wasteItems || INITIAL_WASTE_ITEMS;
        this.metrics = data.metrics || INITIAL_METRICS;
        this.transactions = data.transactions || [];
      } else {
        this.users = INITIAL_USERS;
        this.bins = INITIAL_BINS;
        this.pickups = INITIAL_PICKUPS;
        this.routes = INITIAL_ROUTES;
        this.alerts = INITIAL_ALERTS;
        this.listings = INITIAL_LISTINGS;
        this.wasteItems = INITIAL_WASTE_ITEMS;
        this.metrics = INITIAL_METRICS;
        this.transactions = [];
        this.save();
      }
    } catch (e) {
      console.error('Error loading database', e);
      this.users = INITIAL_USERS;
      this.bins = INITIAL_BINS;
    }
  }

  save() {
    try {
      const payload = {
        users: this.users,
        bins: this.bins,
        pickups: this.pickups,
        routes: this.routes,
        alerts: this.alerts,
        listings: this.listings,
        wasteItems: this.wasteItems,
        metrics: this.metrics,
        transactions: this.transactions
      };
      fs.writeFileSync(STORE_PATH, JSON.stringify(payload, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving database', e);
    }
  }

  getBins(): SmartBin[] {
    return this.bins;
  }

  updateBin(id: string, updates: Partial<SmartBin>): SmartBin | undefined {
    const bin = this.bins.find(b => b.id === id);
    if (bin) {
      Object.assign(bin, updates);
      bin.lastUpdated = new Date().toISOString();
      if (bin.fillLevel > 90 || bin.gasConcentrationPpm > 450 || bin.temperatureC > 40) {
        bin.status = 'Critical';
      } else if (bin.fillLevel > 75 || bin.gasConcentrationPpm > 250) {
        bin.status = 'Warning';
      } else {
        bin.status = 'Normal';
      }
      this.save();
    }
    return bin;
  }

  addPickUpRequest(req: Omit<PickupRequest, 'id' | 'status' | 'pointsAwarded'>): PickupRequest {
    const newReq: PickupRequest = {
      ...req,
      id: `pickup-${Date.now()}`,
      status: 'Pending',
      pointsAwarded: Math.round(req.estimatedWeightKg * 4)
    };
    this.pickups.unshift(newReq);
    this.save();
    return newReq;
  }

  updatePickupStatus(id: string, status: PickupRequest['status']): PickupRequest | undefined {
    const request = this.pickups.find(p => p.id === id);
    if (request) {
      const oldStatus = request.status;
      request.status = status;
      if (status === 'Collected' && oldStatus !== 'Collected') {
        // Award points to citizen
        const user = this.users.find(u => u.id === request.citizenId);
        if (user) {
          user.points += request.pointsAwarded;
        }
        // Update general stats
        this.metrics.totalWasteCollectedKg += request.estimatedWeightKg;
        this.metrics.carbonReducedKg += Math.round(request.estimatedWeightKg * 1.5);
      }
      this.save();
    }
    return request;
  }

  addDumpingAlert(alert: Omit<DumpingAlert, 'id' | 'status' | 'reportTime'>): DumpingAlert {
    const newAlert: DumpingAlert = {
      ...alert,
      id: `alert-${Date.now()}`,
      status: 'Unresolved',
      reportTime: new Date().toISOString()
    };
    this.alerts.unshift(newAlert);
    this.save();
    return newAlert;
  }

  updateAlertStatus(id: string, status: DumpingAlert['status']): DumpingAlert | undefined {
    const alert = this.alerts.find(a => a.id === id);
    if (alert) {
      alert.status = status;
      this.save();
    }
    return alert;
  }

  addMarketplaceListing(list: Omit<MarketplaceListing, 'id' | 'status' | 'timestamp'>): MarketplaceListing {
    const newList: MarketplaceListing = {
      ...list,
      id: `list-${Date.now()}`,
      status: 'Available',
      timestamp: new Date().toISOString()
    };
    this.listings.unshift(newList);
    this.save();
    return newList;
  }

  buyMarketplaceListing(listingId: string, buyerId: string, buyerName: string): MarketplaceTransaction | undefined {
    const listing = this.listings.find(l => l.id === listingId);
    if (listing && listing.status === 'Available') {
      listing.status = 'Sold';
      const transaction: MarketplaceTransaction = {
        id: `tx-${Date.now()}`,
        listingId,
        buyerId,
        buyerName,
        sellerId: listing.sellerId,
        sellerName: listing.sellerName,
        priceCredits: listing.askingPriceCredits,
        timestamp: new Date().toISOString()
      };
      
      // Update points
      const seller = this.users.find(u => u.id === listing.sellerId);
      if (seller) {
        seller.points += listing.askingPriceCredits;
      }
      const buyer = this.users.find(u => u.id === buyerId);
      if (buyer) {
        buyer.points -= listing.askingPriceCredits;
      }

      this.transactions.unshift(transaction);
      this.save();
      return transaction;
    }
    return undefined;
  }

  addWasteItem(item: Omit<WasteItem, 'id' | 'timestamp'>): WasteItem {
    const newItem: WasteItem = {
      ...item,
      id: `item-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    this.wasteItems.unshift(newItem);

    // Update global metrics
    if (newItem.recyclable) {
      this.metrics.totalWasteCollectedKg += 1.5; // Estimated scanned item weight
      this.metrics.carbonReducedKg += Math.round(newItem.carbonSavedKg * 10) / 10;
      
      // Update citizen leaderboards/rewards
      const citizen = this.users.find(u => u.id === newItem.citizenId);
      if (citizen) {
        citizen.points += 20; // 20 reward points for scanning & segregating correctly
        if (citizen.points > 1500 && !citizen.badges.includes('Green Warrior')) {
          citizen.badges.push('Green Warrior');
        }
        if (citizen.points > 2500 && !citizen.badges.includes('Waste Hero')) {
          citizen.badges.push('Waste Hero');
        }
      }
    }
    
    this.save();
    return newItem;
  }

  addRoute(route: CollectionRoute) {
    this.routes.unshift(route);
    this.save();
  }

  updateRouteStatus(id: string, status: CollectionRoute['status']): CollectionRoute | undefined {
    const route = this.routes.find(r => r.id === id);
    if (route) {
      route.status = status;
      if (status === 'Completed') {
        // Reset the bins that belong to this route
        route.binIds.forEach(binId => {
          this.updateBin(binId, {
            fillLevel: Math.floor(Math.random() * 8), // Reset to near 0
            weightKg: 0,
            gasConcentrationPpm: 15,
            temperatureC: 18
          });
        });
      }
      this.save();
    }
    return route;
  }
}

export const dbInstance = new Database();
