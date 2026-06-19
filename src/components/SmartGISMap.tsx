import React, { useState, useEffect } from 'react';
import { SmartBin, CollectionRoute, DumpingAlert, MarketplaceListing } from '../types';
import { Truck, MapPin, AlertCircle, ShoppingBag, Eye, HelpCircle } from 'lucide-react';

interface SmartGISMapProps {
  bins: SmartBin[];
  routes: CollectionRoute[];
  alerts: DumpingAlert[];
  listings: MarketplaceListing[];
  onSelectBin?: (bin: SmartBin) => void;
  selectedBinId?: string;
  activeView: 'standard' | 'heatmap' | 'routes' | 'marketplace';
}

export default function SmartGISMap({
  bins,
  routes,
  alerts,
  listings,
  onSelectBin,
  selectedBinId,
  activeView
}: SmartGISMapProps) {
  const [animatedTruckPos, setAnimatedTruckPos] = useState<number>(0);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  // Animate truck along active routes
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedTruckPos((prev) => (prev + 1) % 100);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // Standard center of San Francisco relative coordinate mapping
  // Map range: 37.76 to 37.81 latitude, -122.44 to -122.39 longitude
  const getXY = (lat: number, lng: number) => {
    const minLat = 37.76;
    const maxLat = 37.815;
    const minLng = -122.44;
    const maxLng = -122.39;

    // Convert to percentages
    const x = ((lng - minLng) / (maxLng - minLng)) * 100;
    // Map latitude upwards
    const y = 100 - ((lat - minLat) / (maxLat - minLat)) * 100;

    return { x: Math.min(95, Math.max(5, x)), y: Math.min(95, Math.max(5, y)) };
  };

  // Select first route by default if any
  useEffect(() => {
    if (routes.length > 0 && !selectedRouteId) {
      setSelectedRouteId(routes[0].id);
    }
  }, [routes]);

  const activeRoute = routes.find(r => r.id === selectedRouteId);

  return (
    <div className="relative w-full h-[400px] md:h-[550px] bg-slate-950 rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl">
      {/* City Street Vector Grid Simulator Background */}
      <div className="absolute inset-0 opacity-15 pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#22d3ee" strokeWidth="0.8" />
              <circle cx="0" cy="0" r="1.5" fill="#22d3ee" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          {/* Main Diagonal simulated highways */}
          <path d="M 0,100 L 800,500" stroke="#475569" strokeWidth="3" fill="none" strokeDasharray="5,5" />
          <path d="M 100,550 L 700,50" stroke="#475569" strokeWidth="3" fill="none" strokeDasharray="5,5" />
          <path d="M 50,220 L 750,220" stroke="#334155" strokeWidth="1.5" fill="none" />
          <path d="M 420,0 L 420,600" stroke="#334155" strokeWidth="1.5" fill="none" />
        </svg>
      </div>

      {/* Heatmap Overlay (Waste Hotspots Radar Glows) */}
      {activeView === 'heatmap' && (
        <div className="absolute inset-0 pointer-events-none">
          {bins.map((bin) => {
            const { x, y } = getXY(bin.latitude, bin.longitude);
            // Size of radiation based on load
            const radius = bin.fillLevel * 1.2;
            let color = 'rgba(34, 197, 94, 0.2)'; // Green
            if (bin.fillLevel > 90 || bin.status === 'Critical') {
              color = 'rgba(239, 68, 68, 0.45)'; // Red
            } else if (bin.fillLevel > 75 || bin.status === 'Warning') {
              color = 'rgba(245, 158, 11, 0.35)'; // Amber
            }

            return (
              <div
                key={`glow-${bin.id}`}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-1000 animate-pulse"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  width: `${radius}px`,
                  height: `${radius}px`,
                  backgroundColor: color,
                  filter: 'blur(16px)',
                }}
              />
            );
          })}
          {alerts.map((alert) => {
            if (alert.status !== 'Cleared') {
              const { x, y } = getXY(alert.latitude, alert.longitude);
              return (
                <div
                  key={`alert-glow-${alert.id}`}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 rounded-full bg-crimson transition-all duration-1000 animate-ping"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    width: '60px',
                    height: '60px',
                    backgroundColor: 'rgba(239, 68, 68, 0.4)',
                    filter: 'blur(8px)',
                  }}
                />
              );
            }
            return null;
          })}
        </div>
      )}

      {/* Compass / Map Watermark */}
      <div className="absolute top-4 left-4 z-10 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-400 tracking-wider flex items-center gap-2 shadow-lg">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        GIS ACTIVE: SAN FRANCISCO METRO
      </div>

      {/* Map Layers Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 space-y-1.5 shadow-lg max-w-[200px]">
        <div className="font-semibold text-slate-400 text-xs mb-1">MAP PROTOCOLS</div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
          <span>Bin: Normal (&lt;75%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block animate-pulse" />
          <span>Bin: Warning (&gt;75%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block animate-ping" />
          <span>Bin: Critical (&gt;90%)</span>
        </div>
        <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800">
          <AlertCircle className="w-3.5 h-3.5 text-rose-500 inline-block" />
          <span>Illegal Dumping Spot</span>
        </div>
        {activeView === 'routes' && (
          <div className="flex items-center gap-1.5 text-cyan-400 pt-1 border-t border-slate-800">
            <Truck className="w-3.5 h-3.5 animate-bounce" />
            <span>Active Collection Truck</span>
          </div>
        )}
      </div>

      {/* Render route lines on the Map in "routes" mode */}
      {activeView === 'routes' && activeRoute && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.4" />
            </linearGradient>
          </defs>
          {/* Construct lines between ordered stops */}
          {(() => {
            const sortedPoints = [...activeRoute.points].sort((a,b) => a.order - b.order);
            const pathData = sortedPoints.map((pt, idx) => {
              const { x, y } = getXY(pt.lat, pt.lng);
              // Calculate mapping inside SVG node (which has absolute pixels vs percentages)
              return `${idx === 0 ? 'M' : 'L'} ${x}%, ${y}%`;
            }).join(' ');

            return (
              <>
                <path
                  d={pathData}
                  fill="none"
                  stroke="url(#routeGradient)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="8,8"
                />
                
                {/* Truck Marker Animation along path */}
                {(() => {
                  // Find segment index based on percentage
                  const ptsCount = sortedPoints.length;
                  if (ptsCount < 2) return null;
                  const percentPerSegment = 100 / (ptsCount - 1);
                  const segmentIdx = Math.min(ptsCount - 2, Math.floor(animatedTruckPos / percentPerSegment));
                  const progressInSegment = (animatedTruckPos % percentPerSegment) / percentPerSegment;

                  const startPt = sortedPoints[segmentIdx];
                  const endPt = sortedPoints[segmentIdx + 1];

                  if (!startPt || !endPt) return null;

                  const startPos = getXY(startPt.lat, startPt.lng);
                  const endPos = getXY(endPt.lat, endPt.lng);

                  const curX = startPos.x + (endPos.x - startPos.x) * progressInSegment;
                  const curY = startPos.y + (endPos.y - startPos.y) * progressInSegment;

                  return (
                    <g transform={`translate(${curX} ${curY})`} className="animate-pulse">
                      <circle r="14" fill="#06b6d4" fillOpacity="0.3" className="animate-ping" />
                      <circle r="10" fill="#0891b2" />
                      {/* Micro Truck SVG inside map */}
                      <path d="M-4,-2 L0,-2 L2,0 L4,0 L4,4 L-4,4 Z" fill="#ffffff" transform="scale(1.2)" />
                    </g>
                  );
                })()}
              </>
            );
          })()}
        </svg>
      )}

      {/* RENDER ACTIVE NODES */}
      <div className="absolute inset-0">
        {/* Render Bins */}
        {bins.map((bin) => {
          const { x, y } = getXY(bin.latitude, bin.longitude);
          const isSelected = selectedBinId === bin.id;

          // Determine bin indicator color
          let indicatorBg = 'bg-emerald-500';
          let borderGlow = 'border-emerald-500/50';
          let ringPulse = 'group-hover:ring-emerald-500';

          if (bin.fillLevel > 90) {
            indicatorBg = 'bg-rose-500';
            borderGlow = 'border-rose-500/80 animate-pulse';
            ringPulse = 'ring-rose-500 animate-ping';
          } else if (bin.fillLevel > 75) {
            indicatorBg = 'bg-amber-500';
            borderGlow = 'border-amber-500/60';
            ringPulse = 'ring-amber-500';
          }

          return (
            <button
              type="button"
              id={`bin-node-${bin.id}`}
              key={bin.id}
              onClick={() => onSelectBin && onSelectBin(bin)}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 group z-20 focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded-full"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <div className="relative">
                {/* Ping ring for priority bins */}
                {(bin.fillLevel > 90 || isSelected) && (
                  <span className={`absolute -inset-2.5 rounded-full ring-2 opacity-75 ${ringPulse}`} />
                )}
                {/* Main Node */}
                <div className={`w-9 h-9 rounded-full bg-slate-900 border-2 ${borderGlow} flex items-center justify-center transition-all duration-300 hover:scale-125 hover:bg-slate-800 shadow-lg`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${indicatorBg}`}>
                    {bin.fillLevel}
                  </div>
                </div>

                {/* Micro Hover info card */}
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-slate-900/95 backdrop-blur-sm border border-slate-800 text-white rounded-lg p-2.5 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50 min-w-[150px] font-sans">
                  <p className="text-[11px] font-semibold text-slate-100">{bin.name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{bin.locationName}</p>
                  <div className="flex justify-between items-center mt-1.5 pt-1.5 border-t border-slate-800 text-[10px] text-slate-400">
                    <span>Fill Level:</span>
                    <span className="font-bold text-white">{bin.fillLevel}%</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span>Gas index:</span>
                    <span className={`font-semibold ${bin.gasConcentrationPpm > 400 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {bin.gasConcentrationPpm}ppm
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}

        {/* Render Illegal Dumping Reports alerts */}
        {alerts.map((alert) => {
          if (alert.status === 'Cleared') return null;
          const { x, y } = getXY(alert.latitude, alert.longitude);
          const severityColors = {
            Low: 'text-blue-400 border-blue-400/50 hover:bg-blue-950',
            Medium: 'text-amber-400 border-amber-400/50 hover:bg-amber-950',
            High: 'text-rose-400 border-rose-400/50 hover:bg-rose-950',
            Critical: 'text-red-500 border-red-500 animate-bounce hover:bg-red-950'
          };

          return (
            <div
              key={alert.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-35 group"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <div className={`w-8 h-8 rounded-lg bg-slate-950/90 border border-double ${severityColors[alert.severity]} flex items-center justify-center shadow-2xl transition-all duration-300`}>
                <AlertCircle className="w-4 h-4 animate-pulse" />
              </div>

              {/* Hover card */}
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-rose-950/95 backdrop-blur-md border border-rose-800/60 text-white rounded-lg p-2.5 shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50 min-w-[200px] font-sans">
                <span className="bg-rose-900 text-rose-100 text-[9px] uppercase tracking-wider px-2 py-0.5 rounded font-bold font-mono">
                  DUMPING ALERT: {alert.severity}
                </span>
                <p className="text-[11px] font-medium text-slate-100 mt-1">{alert.locationName}</p>
                <p className="text-[10px] text-rose-200 line-clamp-2 mt-1 italic">"{alert.description}"</p>
                <p className="text-[9px] text-slate-400 mt-1.5 font-mono">Reported: {new Date(alert.reportTime).toLocaleTimeString()}</p>
              </div>
            </div>
          );
        })}

        {/* Render Marketplace listings (Materials available for collection) */}
        {activeView === 'marketplace' && listings.map((list) => {
          if (list.status !== 'Available') return null;
          const { x, y } = getXY(list.coordinates.lat, list.coordinates.lng);

          return (
            <div
              key={list.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-30 group"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <div className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-400 flex items-center justify-center shadow-lg transition-transform hover:scale-125 cursor-pointer">
                <ShoppingBag className="w-4.5 h-4.5 text-cyan-400" />
              </div>

              {/* Hover Description card */}
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-slate-900 border border-cyan-500/40 text-white rounded-xl p-3 shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50 min-w-[220px]">
                <div className="flex justify-between items-start">
                  <span className="bg-cyan-900/50 text-cyan-300 text-[9px] px-2 py-0.5 rounded-full font-mono font-bold">
                    {list.category}
                  </span>
                  <span className="text-emerald-400 font-mono font-bold text-xs">
                    {list.askingPriceCredits} Pts
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-100 mt-1.5">{list.title}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{list.estimatedWeightKg}kg • {list.materialType}</p>
                <p className="text-[10px] text-cyan-200 mt-1 bg-cyan-950/60 p-1.5 rounded border border-cyan-900/50 line-clamp-2">
                  {list.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Interactive Route Switcher bar (Only visible in Route Optimization View) */}
      {activeView === 'routes' && routes.length > 0 && (
        <div className="absolute top-4 right-4 z-40 bg-slate-900/95 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 text-xs flex gap-1 shadow-2xl">
          {routes.map((r) => (
            <button
              type="button"
              key={r.id}
              onClick={() => setSelectedRouteId(r.id)}
              className={`px-3 py-1.5 rounded-lg font-mono font-semibold transition-all ${
                selectedRouteId === r.id
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-300'
              }`}
            >
              {r.routeName.split(':')[0]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
