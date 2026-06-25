import React, { useState, useEffect } from 'react';
import { 
  Leaf, Info, Sparkles, Building, Briefcase, Truck, Users, LayoutDashboard, 
  MapPin, AlertCircle, TrendingUp, Compass, Settings, User as UserIcon, LogIn,
  ShieldCheck, RefreshCw, Layers, ShieldAlert, ShoppingBag, Loader2
} from 'lucide-react';
import { SmartBin, CollectionRoute, DumpingAlert, MarketplaceListing, MarketplaceTransaction, WasteItem, User, SystemMetrics, PickupRequest } from './types';

// Importing modular panels
import SmartGISMap from './components/SmartGISMap';
import CitizenPanel from './components/CitizenPanel';
import MunicipalityPanel from './components/MunicipalityPanel';
import RecyclingPanel from './components/RecyclingPanel';
import CollectionPanel from './components/CollectionPanel';

export default function App() {
  // Roles list
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Dashboard Metrics
  const [metrics, setMetrics] = useState<SystemMetrics>({
    totalWasteCollectedKg: 45290,
    recyclingRatePercent: 74.2,
    carbonReducedKg: 52400,
    landfillReductionPercent: 68.5,
    smartBinsCount: 5,
    citizenRewardsDistributed: 15400,
    activeRoutesCount: 1
  });

  // Master lists loaded from DB
  const [bins, setBins] = useState<SmartBin[]>([]);
  const [routes, setRoutes] = useState<CollectionRoute[]>([]);
  const [alerts, setAlerts] = useState<DumpingAlert[]>([]);
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [transactions, setTransactions] = useState<MarketplaceTransaction[]>([]);
  const [wasteHistory, setWasteHistory] = useState<WasteItem[]>([]);
  const [pickups, setPickups] = useState<PickupRequest[]>([]);

  // Telemetry status
  const [mapMode, setMapMode] = useState<'standard' | 'heatmap' | 'routes' | 'marketplace'>('standard');
  const [selectedBinId, setSelectedBinId] = useState<string | undefined>(undefined);
  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(true);

  // Sync state from server
  const syncServerData = () => {
    setLoading(true);
    
    // Fetch users
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        if (!currentUser && data.length > 0) {
          // Default to citizen
          setCurrentUser(data.find((u: any) => u.role === 'citizen') || data[0]);
        } else if (currentUser) {
          // sync currently active user object details to fetch updated balance/points
          const updated = data.find((u: any) => u.id === currentUser.id);
          if (updated) setCurrentUser(updated);
        }
      })
      .catch(err => console.error(err));

    // Fetch bins
    fetch('/api/bins')
      .then(res => res.json())
      .then(data => setBins(data))
      .catch(err => console.error(err));

    // Fetch routes
    fetch('/api/routes')
      .then(res => res.json())
      .then(data => setRoutes(data))
      .catch(err => console.error(err));

    // Fetch alerts
    fetch('/api/alerts')
      .then(res => res.json())
      .then(data => setAlerts(data))
      .catch(err => console.error(err));

    // Fetch collections/pickups
    fetch('/api/pickups')
      .then(res => res.json())
      .then(data => setPickups(data))
      .catch(err => console.error(err));

    // Fetch marketplace
    fetch('/api/marketplace')
      .then(res => res.json())
      .then(data => {
        setListings(data.listings);
        setTransactions(data.transactions);
      })
      .catch(err => console.error(err));

    // Fetch environmental history of current logged citizen
    const activeCitizenId = currentUser?.id || 'user-citizen';
    fetch(`/api/citizen/${activeCitizenId}/waste`)
      .then(res => res.json())
      .then(data => setWasteHistory(data))
      .catch(err => console.error(err));

    // Fetch metrics
    fetch('/api/metrics')
      .then(res => res.json())
      .then(data => setMetrics(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    syncServerData();
  }, []);

  // Sync client waste items whenever the user switched roles/users changes
  useEffect(() => {
    if (currentUser) {
      fetch(`/api/citizen/${currentUser.id}/waste`)
        .then(res => res.json())
        .then(data => setWasteHistory(data))
        .catch(err => console.error(err));
    }
  }, [currentUser]);

  // Switch Active User / Role
  const handleSwitchRole = (userId: string, role: string) => {
    fetch('/api/users/switch-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        // Find correct user and swap role on frontend
        const updatedUsers = users.map(user => {
          if (user.id === userId) {
            return { ...user, role: role as any };
          }
          return user;
        });
        setUsers(updatedUsers);
        const newUserObj = updatedUsers.find(u => u.id === userId);
        if (newUserObj) {
          setCurrentUser(newUserObj);
          
          // Smooth map filter shift based on role
          if (role === 'municipality') setMapMode('heatmap');
          else if (role === 'collection') setMapMode('routes');
          else if (role === 'recycler') setMapMode('marketplace');
          else setMapMode('standard');
        }
      }
    })
    .catch(err => console.error(err));
  };

  // IoT sensor update triggered
  const handleTriggerTelemetry = () => {
    fetch('/api/bins/trigger-telemetry', { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setBins(data.bins);
        }
      })
      .catch(err => console.error(err));
  };

  // Manual bin updates
  const handleUpdateManualBin = (updatedBin: SmartBin) => {
    setBins(bins.map(b => b.id === updatedBin.id ? updatedBin : b));
  };

  // Dispatch Logistics Routing Optimization
  const handleOptimizeRoute = (payload: any) => {
    fetch('/api/routes/optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        setRoutes([data.route, ...routes]);
      }
    })
    .catch(err => console.error(err));
  };

  // Clear Dumping Alert
  const handleClearAlert = (alertId: string) => {
    fetch('/api/alerts/update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: alertId, status: 'Cleared' })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        setAlerts(alerts.map(a => a.id === alertId ? { ...a, status: 'Cleared' } : a));
      }
    })
    .catch(err => console.error(err));
  };

  // Circular marketplace trade purchase
  const handlePurchaseListing = (listingId: string) => {
    if (!currentUser) return;
    
    fetch('/api/marketplace/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listingId,
        buyerId: currentUser.id,
        buyerName: currentUser.name
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        // Redraw listings and transactions lists
        setListings(listings.map(l => l.id === listingId ? { ...l, status: 'Sold' } : l));
        setTransactions([data.transaction, ...transactions]);
        
        // Award balance points
        setUsers(data.users);
        const freshUserObj = data.users.find((u: any) => u.id === currentUser.id);
        if (freshUserObj) setCurrentUser(freshUserObj);

        alert("Circular transaction recorded on distributed scrap registry. Points balance updated.");
      }
    })
    .catch(err => {
      console.error(err);
      alert("Trade transaction failed. Verify points balance.");
    });
  };

  // List materials on marketplace
  const handleAddMarketplaceListing = (payload: any) => {
    fetch('/api/marketplace/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        setListings([data.listing, ...listings]);
      }
    })
    .catch(err => console.error(err));
  };

  // Driver route updates
  const handleUpdateRouteStatus = (routeId: string, status: CollectionRoute['status']) => {
    fetch('/api/routes/update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: routeId, status })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        setRoutes(routes.map(r => r.id === routeId ? { ...r, status } : r));
        syncServerData(); // refresh smart bins levels
      }
    })
    .catch(err => console.error(err));
  };

  // Client pickup complete status
  const handleUpdatePickupStatus = (pickupId: string, status: 'Collected') => {
    fetch('/api/pickups/update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: pickupId, status })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        setPickups(pickups.map(p => p.id === pickupId ? { ...p, status } : p));
        setUsers(data.users);
      }
    })
    .catch(err => console.error(err));
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-100">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-400" />
          <p className="text-sm font-mono text-slate-400">Booting GREEN EYE Ecosystem Core...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 selection:bg-cyan-500 selection:text-slate-950">
      
      {/* 1. TOP UTILITY HEADER SECTION */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 font-black shadow-md border border-emerald-400/40">
              <Leaf className="w-5.5 h-5.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-display font-extrabold text-[15px] md:text-xl tracking-tight bg-gradient-to-r from-emerald-400 via-green-400 to-cyan-400 bg-clip-text text-transparent">
                  GREEN EYE
                </h1>
                <span className="text-[8px] bg-cyan-900/40 text-cyan-400 border border-cyan-800/20 px-1.5 py-0.2 rounded font-black font-mono">
                  PRO AI
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono">Smart Waste Segregation & Circular Intelligence Platfom</p>
            </div>
          </div>

          {/* Interactive Persona / RBAC Switcher Toolbar */}
          <div className="flex items-center bg-slate-900/90 border border-slate-800 p-1 rounded-xl gap-1">
            <span className="text-[10px] font-mono text-slate-400 px-2 font-bold uppercase hidden lg:inline">PERSONA SWITCHER:</span>
            {users.map((user) => {
              const roleIcons = {
                citizen: <UserIcon className="w-3.5 h-3.5" />,
                municipality: <Building className="w-3.5 h-3.5" />,
                recycler: <Briefcase className="w-3.5 h-3.5" />,
                collection: <Truck className="w-3.5 h-3.5" />,
                admin: <ShieldCheck className="w-3.5 h-3.5" />
              };

              const roleLabel = {
                citizen: 'Citizen Scout',
                municipality: 'Municipality Command',
                recycler: 'Recycling Depot',
                collection: 'Truck Crew'
              };

              if (user.role === 'admin') return null; // keep simple standard personas

              const isActive = currentUser.id === user.id;

              return (
                <button
                  type="button"
                  key={user.id}
                  onClick={() => handleSwitchRole(user.id, user.role)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] m-0 font-bold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-slate-950 shadow-md scale-105'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  {roleIcons[user.role]}
                  <span>{roleLabel[user.role]}</span>
                </button>
              );
            })}
          </div>

        </div>
      </header>

      {/* 2. CORE WATERMARK SUBTITLES OR METRIC LOGGERS */}
      <section className="bg-slate-900/20 border-b border-slate-900/60 py-4">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className="p-3 bg-slate-900/30 rounded-xl border border-slate-850 text-center">
              <span className="text-[9px] font-mono text-slate-500 uppercase">MUNICIPAL SCRAP COLLECTED</span>
              <p className="text-sm md:text-xl font-bold text-slate-200 font-mono mt-1">
                {(metrics.totalWasteCollectedKg / 1000).toFixed(1)} <span className="text-xs font-normal text-slate-400">Tons</span>
              </p>
            </div>

            <div className="p-3 bg-slate-900/30 rounded-xl border border-slate-850 text-center">
              <span className="text-[9px] font-mono text-slate-500 uppercase">RECYCLING RATIO</span>
              <p className="text-sm md:text-xl font-bold text-slate-200 font-mono mt-1">
                {metrics.recyclingRatePercent}%
              </p>
            </div>

            <div className="p-3 bg-slate-900/30 rounded-xl border border-slate-850 text-center">
              <span className="text-[9px] font-mono text-slate-500 uppercase">CO₂ EMISSIONS SAVED</span>
              <p className="text-sm md:text-xl font-bold text-slate-200 font-mono mt-1">
                {(metrics.carbonReducedKg).toLocaleString()} <span className="text-xs font-normal text-slate-400">Kg</span>
              </p>
            </div>

            <div className="p-3 bg-slate-900/30 rounded-xl border border-slate-850 text-center">
              <span className="text-[9px] font-mono text-slate-500 uppercase">LANDFILL DEVIATIONS</span>
              <p className="text-sm md:text-xl font-bold text-emerald-400 font-mono mt-1">
                {metrics.landfillReductionPercent}%
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 3. CORE LAYOUT VIEWPORTS */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-8">
        
        {/* INTERACTIVE GIS MAP SECTION */}
        <div className="space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Compass className="text-cyan-400 w-5 h-5 animate-pulse" />
              <h2 className="font-display font-bold text-slate-100 text-lg uppercase tracking-wider">
                Smart GIS Grid & Heatmap Analytics
              </h2>
            </div>

            {/* GIS MAP VIEW CONTROLS */}
            <div className="flex items-center bg-slate-900 border border-slate-850 rounded-lg p-1 text-[10px] font-mono">
              <button
                type="button"
                onClick={() => setMapMode('standard')}
                className={`px-2 py-1 rounded transition-colors ${
                  mapMode === 'standard' ? 'bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Standard Bins
              </button>
              <button
                type="button"
                onClick={() => setMapMode('heatmap')}
                className={`px-2 py-1 rounded transition-colors ${
                  mapMode === 'heatmap' ? 'bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Hotspots Density
              </button>
              <button
                type="button"
                onClick={() => setMapMode('routes')}
                className={`px-2 py-1 rounded transition-colors ${
                  mapMode === 'routes' ? 'bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Logistics Drivers
              </button>
              <button
                type="button"
                onClick={() => setMapMode('marketplace')}
                className={`px-2 py-1 rounded transition-colors ${
                  mapMode === 'marketplace' ? 'bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Circular Market
              </button>
            </div>
          </div>

          <SmartGISMap
            bins={bins}
            routes={routes}
            alerts={alerts}
            listings={listings}
            selectedBinId={selectedBinId}
            onSelectBin={(bin) => setSelectedBinId(bin.id)}
            activeView={mapMode}
          />
        </div>

        {/* CONTROLLER SECTION CORRESPONDING TO ACTIVE SWITCHED USER ROLE */}
        <div className="border-t border-slate-900 pt-8 space-y-6">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">
              ACTIVE SUITE: {currentUser.role.toUpperCase()} COMPONENT MODULE
            </span>
          </div>

          {currentUser.role === 'citizen' && (
            <CitizenPanel
              currentUser={currentUser}
              users={users}
              wasteHistory={wasteHistory}
              pickups={pickups}
              onScanComplete={(item) => {
                setWasteHistory([item, ...wasteHistory]);
                syncServerData(); // reload statistics and user rewards wallet
              }}
              onPickupScheduled={(newPickup) => {
                setPickups([newPickup, ...pickups]);
                syncServerData();
              }}
              isScanning={isScanning}
              setIsScanning={setIsScanning}
              onRefreshUsers={syncServerData}
            />
          )}

          {currentUser.role === 'municipality' && (
            <MunicipalityPanel
              bins={bins}
              routes={routes}
              alerts={alerts}
              onTriggerTelemetry={handleTriggerTelemetry}
              onUpdateManualBin={handleUpdateManualBin}
              onOptimizeRoute={handleOptimizeRoute}
              onClearAlert={handleClearAlert}
            />
          )}

          {currentUser.role === 'recycler' && (
            <RecyclingPanel
              currentUser={currentUser}
              users={users}
              listings={listings}
              transactions={transactions}
              onPurchaseListing={handlePurchaseListing}
              onAddListing={handleAddMarketplaceListing}
            />
          )}

          {currentUser.role === 'collection' && (
            <CollectionPanel
              currentUser={currentUser}
              routes={routes}
              bins={bins}
              pickups={pickups}
              onUpdateRouteStatus={handleUpdateRouteStatus}
              onUpdatePickupStatus={handleUpdatePickupStatus}
            />
          )}
        </div>

      </main>

      {/* FOOTER CONTROLS */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© 2026 GREEN EYE Inc. All rights reserved. Developed for Global Smart Cities.</p>
          <div className="flex gap-4">
            <a href="#gis-map" className="hover:text-slate-300">Privacy Policy</a>
            <a href="#citizen-dashboard" className="hover:text-slate-300">Terms of Service</a>
            <a href="#control" className="hover:text-slate-300">API Docs</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
