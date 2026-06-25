import React, { useState } from 'react';
import { CollectionRoute, SmartBin, PickupRequest, User } from '../types';
import { Truck, Navigation, CheckSquare, Square, CheckCircle, AlertTriangle, ShieldCheck, MapPin } from 'lucide-react';

interface CollectionPanelProps {
  currentUser: User;
  routes: CollectionRoute[];
  bins: SmartBin[];
  pickups: PickupRequest[];
  onUpdateRouteStatus: (routeId: string, status: CollectionRoute['status']) => void;
  onUpdatePickupStatus: (pickupId: string, status: PickupRequest['status']) => void;
}

export default function CollectionPanel({
  currentUser,
  routes,
  bins,
  pickups,
  onUpdateRouteStatus,
  onUpdatePickupStatus
}: CollectionPanelProps) {
  const [activeDriverTab, setActiveDriverTab] = useState<'routes' | 'pickups'>('routes');
  const [collectedBinIds, setCollectedBinIds] = useState<string[]>([]);

  // Toggle checklist for bins
  const handleToggleBinCollected = (binId: string) => {
    if (collectedBinIds.includes(binId)) {
      setCollectedBinIds(collectedBinIds.filter(id => id !== binId));
    } else {
      setCollectedBinIds([...collectedBinIds, binId]);
    }
  };

  const handleFinishRoute = (routeId: string) => {
    onUpdateRouteStatus(routeId, 'Completed');
    setCollectedBinIds([]);
    alert('Route successfully completed! Bins have been emptied and coordinates refreshed.');
  };

  const myRoutes = routes.filter(r => r.driverName === currentUser.name || r.driverName === 'Marcus Vance');

  return (
    <div className="space-y-6">
      {/* Driver SubNavigation */}
      <div className="flex bg-slate-900 p-1.5 rounded-xl border border-slate-800/80 gap-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveDriverTab('routes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${
            activeDriverTab === 'routes'
              ? 'bg-emerald-500 text-slate-950 font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-850'
          }`}
        >
          <Truck className="w-4 h-4" />
          Active Driving Routes ({myRoutes.filter(r => r.status !== 'Completed').length})
        </button>
        <button
          type="button"
          onClick={() => setActiveDriverTab('pickups')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${
            activeDriverTab === 'pickups'
              ? 'bg-emerald-500 text-slate-950 font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-850'
          }`}
        >
          <MapPin className="w-4 h-4" />
          Scheduled Pickups Checklist
        </button>
      </div>

      {activeDriverTab === 'routes' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 p-4 border border-slate-850 rounded-xl">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest font-mono">Driver Dispatch Console</h3>
            <p className="text-xs text-slate-500 mt-1">Review assigned collection vectors. Travel to bin coordinates, empty materials, and update collection status.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-4">
              {myRoutes.map((route) => {
                const isActive = route.status === 'In Progress';
                const isCompleted = route.status === 'Completed';

                return (
                  <div
                    key={route.id}
                    className={`border rounded-2xl p-5 space-y-4 transition-all ${
                      isActive
                        ? 'bg-cyan-950/10 border-cyan-500/30'
                        : isCompleted
                        ? 'bg-slate-950 border-slate-900 opacity-60'
                        : 'bg-slate-900/80 border-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div>
                        <h4 className="font-semibold text-slate-100 text-sm md:text-base">{route.routeName}</h4>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">OPTIMIZATION MODEL: {route.optimizeAlgo} • DISTANCE: {route.totalDistanceKm}km</p>
                      </div>

                      <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 border rounded-full ${
                        isActive
                          ? 'bg-amber-950/40 text-amber-400 border-amber-900/30 animate-pulse'
                          : isCompleted
                          ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30'
                          : 'bg-blue-950/40 text-blue-400 border-blue-900/30'
                      }`}>
                        {route.status}
                      </span>
                    </div>

                    {/* Navigation path checkpoint checklist */}
                    {isActive && (
                      <div className="space-y-3 bg-slate-950/80 p-4 rounded-xl border border-slate-850">
                        <p className="text-xs font-mono text-slate-300 font-bold tracking-wider">RECEPTOR CONTAINER CHECKLIST:</p>
                        
                        <div className="space-y-2.5">
                          {route.binIds.map((binId) => {
                            const bin = bins.find(b => b.id === binId);
                            const isChecked = collectedBinIds.includes(binId);
                            if (!bin) return null;

                            return (
                              <div
                                key={binId}
                                onClick={() => handleToggleBinCollected(binId)}
                                className={`flex justify-between items-center p-2.5 rounded-lg border cursor-pointer select-none transition-all ${
                                  isChecked
                                    ? 'bg-emerald-950/20 border-emerald-500/20'
                                    : 'bg-slate-900/60 border-slate-850 hover:border-slate-700'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 text-xs">
                                  {isChecked ? (
                                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                                  ) : (
                                    <Square className="w-4 h-4 text-slate-600" />
                                  )}
                                  <span className={`font-semibold ${isChecked ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                                    {bin.name} ({bin.locationName})
                                  </span>
                                </div>

                                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-black ${
                                  bin.fillLevel > 90 ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
                                }`}>
                                  {bin.fillLevel}% Full
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="pt-3 border-t border-slate-850 flex justify-between items-center flex-wrap gap-2">
                      <span className="text-xs text-slate-500 font-mono">Stops Count: {route.stopsCount}</span>

                      {!isActive && !isCompleted && (
                        <button
                          type="button"
                          onClick={() => onUpdateRouteStatus(route.id, 'In Progress')}
                          className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black px-4 py-2 rounded-lg text-xs font-mono transition-all"
                        >
                          START COLLECTION RUN
                        </button>
                      )}

                      {isActive && (
                        <button
                          type="button"
                          onClick={() => handleFinishRoute(route.id)}
                          disabled={collectedBinIds.length < route.binIds.length}
                          className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black px-4 py-2 rounded-lg text-xs font-mono transition-all"
                        >
                          MARK ROUTE AS COMPLETED
                        </button>
                      )}

                      {isCompleted && (
                        <span className="text-[10px] font-mono text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Collection Route Complete
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {myRoutes.length === 0 && (
                <p className="text-xs text-slate-500 italic text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl">
                  No active driving collection routes assigned to you.
                </p>
              )}
            </div>

            <div className="lg:col-span-4 space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 text-rose-400">
                  <AlertTriangle className="w-4.5 h-4.5 animate-bounce" />
                  <h4 className="font-bold text-xs uppercase tracking-wider font-mono">DANGER: Hotspots Alerts</h4>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Always inspect nearby areas for unauthorized box-vehicles dumping electronic batteries or chemical cans before concluding stops checkpoints. Report high-density spots immediately using municipal channels.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULED PICKUP CHECKLISTS */}
      {activeDriverTab === 'pickups' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-200 uppercase tracking-widest font-mono">Heavy Collection Pickups Checklist</h3>
            <p className="text-xs text-slate-500 mt-1">Checklist of citizen schedules requiring high-load cargo or freight hauls.</p>
          </div>

          <div className="space-y-3">
            {pickups.map((p) => {
              const belongsToRoutes = p.status !== 'Collected';
              return (
                <div key={p.id} className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs">
                  <div className="space-y-1.5 md:max-w-xl text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200 text-sm">{p.citizenName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">[{p.id}]</span>
                    </div>
                    <p className="text-slate-300 font-sans text-xs"><b>Material Scrap:</b> {p.materials}</p>
                    <p className="text-slate-400 font-sans text-[11px] flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      {p.address}
                    </p>
                  </div>

                  <div className="text-right flex flex-row md:flex-col justify-between items-center md:items-end w-full md:w-auto border-t border-slate-900 md:border-0 pt-2.5 md:pt-0">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-mono">WEIGHT ESTIMATE</p>
                      <p className="font-semibold text-slate-200 font-mono text-sm mt-0.5">{p.estimatedWeightKg} kg</p>
                    </div>

                    <div className="mt-2 text-right">
                      {p.status === 'Collected' ? (
                        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-800/10">
                          COLLECTED & REWARDED
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            onUpdatePickupStatus(p.id, 'Collected');
                            alert(`Pickup complete. Citizen rewarded +${p.pointsAwarded} Green points.`);
                          }}
                          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-3.5 py-1.5 rounded text-[11px] font-mono transition-colors"
                        >
                          MARK COLLECTED (AWARD POINTS)
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
