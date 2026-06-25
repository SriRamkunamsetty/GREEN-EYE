import React, { useState, useEffect } from 'react';
import { SmartBin, CollectionRoute, DumpingAlert, PredictionData } from '../types';
import { 
  Building, RefreshCw, AlertCircle, TrendingUp, Navigation, Sparkles, Truck, 
  Trash2, ChevronRight, Check, Activity, BarChart3, Radio, Flame, ShieldAlert,
  Loader2
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, 
  Cell, PieChart, Pie
} from 'recharts';

interface MunicipalityPanelProps {
  bins: SmartBin[];
  routes: CollectionRoute[];
  alerts: DumpingAlert[];
  onTriggerTelemetry: () => void;
  onUpdateManualBin: (bin: SmartBin) => void;
  onOptimizeRoute: (payload: any) => void;
  onClearAlert: (alertId: string) => void;
}

export default function MunicipalityPanel({
  bins,
  routes,
  alerts,
  onTriggerTelemetry,
  onUpdateManualBin,
  onOptimizeRoute,
  onClearAlert
}: MunicipalityPanelProps) {
  const [activeTab, setActiveTab] = useState<'control' | 'routes' | 'cctv' | 'predictions'>('control');
  
  // Route optimizer selected bins state
  const [optimizerRouteName, setOptimizerRouteName] = useState('');
  const [optimizerDriverName, setOptimizerDriverName] = useState('Marcus Vance');
  const [selectedBinIds, setSelectedBinIds] = useState<string[]>([]);
  const [selectedAlgo, setSelectedAlgo] = useState<'VRP' | 'A*' | 'Dijkstra'>('VRP');
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Predictions states
  const [predictions, setPredictions] = useState<PredictionData | null>(null);
  const [aiWarning, setAiWarning] = useState('');
  const [loadingPredictions, setLoadingPredictions] = useState(false);

  // Bin form editors
  const [selectedBinEdit, setSelectedBinEdit] = useState<SmartBin | null>(null);

  // Load predictions
  useEffect(() => {
    setLoadingPredictions(true);
    fetch('/api/predictions/dashboard')
      .then(res => res.json())
      .then(data => {
        setPredictions(data);
        setAiWarning(data.aiWarningNotes);
      })
      .catch(err => console.error(err))
      .finally(() => setLoadingPredictions(false));
  }, [activeTab]);

  const handleRouteOptimizeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBinIds.length === 0) {
      alert("Please select at least one Smart Bin to optimize collection logistics.");
      return;
    }
    
    setIsOptimizing(true);
    setTimeout(() => {
      onOptimizeRoute({
        routeName: optimizerRouteName || `Route Collection Ops #${Math.floor(Math.random() * 900 + 100)}`,
        driverName: optimizerDriverName,
        binIds: selectedBinIds,
        algorithm: selectedAlgo
      });
      setIsOptimizing(false);
      setSelectedBinIds([]);
      setOptimizerRouteName('');
      alert("AI logistics route successfully dispatched to Collection Carrier Teams.");
      setActiveTab('routes');
    }, 1500);
  };

  const handleToggleSelectBin = (binId: string) => {
    if (selectedBinIds.includes(binId)) {
      setSelectedBinIds(selectedBinIds.filter(id => id !== binId));
    } else {
      setSelectedBinIds([...selectedBinIds, binId]);
    }
  };

  const handleManualBinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBinEdit) return;
    
    fetch('/api/bins/update-manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(selectedBinEdit)
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        onUpdateManualBin(data.bin);
        setSelectedBinEdit(null);
        alert('Bin configuration and IoT readings override successful.');
      }
    })
    .catch(err => console.error(err));
  };

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#a855f7', '#64748b'];

  return (
    <div className="space-y-6">
      {/* City Command Nav Bar */}
      <div className="flex bg-slate-900 p-1.5 rounded-xl border border-slate-800/80 gap-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('control')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${
            activeTab === 'control'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-850'
          }`}
        >
          <Activity className="w-4 h-4" />
          Smart Bins IoT ({bins.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('routes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${
            activeTab === 'routes'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-850'
          }`}
        >
          <Navigation className="w-4 h-4" />
          Route Logistics ALGO
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('cctv')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${
            activeTab === 'cctv'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-850'
          }`}
        >
          <Radio className="w-4 h-4 text-rose-400" />
          CCTV Dumping Feed ({alerts.filter(a => a.status !== 'Cleared').length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('predictions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${
            activeTab === 'predictions'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-850'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Load Predictions
        </button>
      </div>

      {/* COMMAND CONTROL GRID */}

      {/* 1. IoT SMART BINS */}
      {activeTab === 'control' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-8 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-100 uppercase tracking-wider font-mono">Live IoT Telemetry Core</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Real-time weights, fill indices, volatile gaseous levels and thermal spikes fed from metropolitan smart receptors.</p>
                </div>
                <button
                  type="button"
                  onClick={onTriggerTelemetry}
                  className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/35 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Trigger Telemetry Stream
                </button>
              </div>

              {/* Bins list grids */}
              <div className="space-y-3">
                {bins.map((bin) => {
                  const level = bin.fillLevel;
                  const isHighRisk = level > 90 || bin.status === 'Critical';
                  const isWarning = level > 75 || bin.status === 'Warning';

                  return (
                    <div
                      key={bin.id}
                      className={`p-4 bg-slate-950 border rounded-xl transition-all ${
                        isHighRisk
                          ? 'border-red-900/60 bg-red-950/5'
                          : isWarning
                          ? 'border-amber-900/40 bg-amber-950/5'
                          : 'border-slate-850 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-100 text-sm">{bin.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">[{bin.id}]</span>
                          </div>
                          <p className="text-xs text-slate-400 flex items-center gap-1">
                            <Building className="w-3.5 h-3.5 text-slate-500 inline" />
                            {bin.locationName}
                          </p>
                        </div>

                        {/* Fill progress bars */}
                        <div className="w-full md:w-36 space-y-1">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-slate-400">VOLUME CAPACITY:</span>
                            <span className={`font-bold ${isHighRisk ? 'text-rose-400 font-extrabold' : isWarning ? 'text-amber-400' : 'text-emerald-400'}`}>
                              {level}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                            <div
                              className={`h-full transition-all duration-1000 ${
                                isHighRisk ? 'bg-red-500 animate-pulse' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${level}%` }}
                            />
                          </div>
                        </div>

                        {/* Dynamic sensor readouts */}
                        <div className="flex items-center gap-4 flex-wrap text-xs font-mono">
                          <div className="text-center">
                            <p className="text-[10px] text-slate-500">WEIGHT</p>
                            <p className="font-bold text-slate-300">{bin.weightKg} kg</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] text-slate-500">THERMALS</p>
                            <p className={`font-bold flex items-center gap-0.5 ${bin.temperatureC > 38 ? 'text-orange-400 font-bold animate-pulse' : 'text-slate-300'}`}>
                              {bin.temperatureC > 38 && <Flame className="w-3 h-3 text-orange-400" />}
                              {bin.temperatureC}°C
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] text-slate-500">GASSINGS</p>
                            <p className={`font-bold ${bin.gasConcentrationPpm > 400 ? 'text-rose-400' : 'text-slate-300'}`}>
                              {bin.gasConcentrationPpm} ppm
                            </p>
                          </div>
                        </div>

                        {/* Action Edit override trigger */}
                        <button
                          type="button"
                          onClick={() => setSelectedBinEdit(bin)}
                          className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 px-2.5 py-1.5 rounded-lg text-[10px] font-mono text-slate-300 transition-all self-end md:self-auto"
                        >
                          MANUAL OVERRIDE
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* IoT Manual Configuration Side-Drawer */}
          <div className="xl:col-span-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest font-mono">Manual Sensor Override</h3>
              
              {selectedBinEdit ? (
                <form onSubmit={handleManualBinSubmit} className="space-y-4">
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-850">
                    <p className="text-xs font-bold text-slate-200">{selectedBinEdit.name}</p>
                    <p className="text-[10px] text-slate-500">{selectedBinEdit.locationName}</p>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-mono text-slate-400">FILL LEVEL (%)</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={selectedBinEdit.fillLevel}
                        onChange={(e) => setSelectedBinEdit({ ...selectedBinEdit, fillLevel: parseInt(e.target.value) })}
                        className="w-full accent-cyan-400"
                      />
                      <div className="text-right text-[11px] font-bold text-cyan-400 font-mono">
                        {selectedBinEdit.fillLevel}%
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-mono text-slate-400">WEIGHT (Kg)</label>
                        <input
                          type="number"
                          value={selectedBinEdit.weightKg}
                          onChange={(e) => setSelectedBinEdit({ ...selectedBinEdit, weightKg: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-950 border border-slate-850 p-2 text-xs text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-mono text-slate-400 font-bold">TEMP (°C)</label>
                        <input
                          type="number"
                          value={selectedBinEdit.temperatureC}
                          onChange={(e) => setSelectedBinEdit({ ...selectedBinEdit, temperatureC: parseInt(e.target.value) || 0 })}
                          className="w-full bg-slate-950 border border-slate-850 p-2 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-mono text-slate-400">GAS CONC (Ppm)</label>
                      <input
                        type="number"
                        value={selectedBinEdit.gasConcentrationPpm}
                        onChange={(e) => setSelectedBinEdit({ ...selectedBinEdit, gasConcentrationPpm: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-850 p-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 bg-cyan-500 text-slate-950 font-bold py-2 rounded-lg text-xs"
                    >
                      Save Override
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedBinEdit(null)}
                      className="flex-1 bg-slate-800 text-slate-300 py-2 rounded-lg text-xs border border-slate-700"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-xl">
                  <ShieldAlert className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs">Select a bin node's <b>"Manual Override"</b> button on the left to inject simulated sensory changes.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. ROUTE OPTIMIZATION ENGINE */}
      {activeTab === 'routes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5">
            <form onSubmit={handleRouteOptimizeSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-200 uppercase tracking-wide font-mono">Logistics Dispatch Agent</h3>
                <p className="text-xs text-slate-500 mt-1">Configure automated routing for carrier fleets. Compute fuel optimization constraints using smart algorithms.</p>
              </div>

              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-mono text-slate-400">DESCRIPTIVE ROUTE LABEL</label>
                  <input
                    type="text"
                    value={optimizerRouteName}
                    onChange={(e) => setOptimizerRouteName(e.target.value)}
                    required
                    placeholder="e.g. Marina Fast Overflow Cleanup"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-mono text-slate-400">ASSIGNED CARRIER</label>
                    <select
                      value={optimizerDriverName}
                      onChange={(e) => setOptimizerDriverName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                    >
                      <option value="Marcus Vance">Marcus Vance</option>
                      <option value="Dave Batista">Dave Batista</option>
                      <option value="Sara Jenkins">Sara Jenkins</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-mono text-slate-400">ENGINE ALGO</label>
                    <select
                      value={selectedAlgo}
                      onChange={(e) => setSelectedAlgo(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                    >
                      <option value="VRP">Vehicle Routing Problem (VRP)</option>
                      <option value="A*">A* Heuristic Search</option>
                      <option value="Dijkstra">Dijkstra Shortest Path</option>
                    </select>
                  </div>
                </div>

                {/* Select specific bins */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-mono text-slate-400 uppercase">BIN TARGET NODES ({selectedBinIds.length} Selected)</label>
                  <p className="text-[10px] text-slate-500 mb-1">Click the bins to include in this dispatch sequence:</p>
                  
                  <div className="space-y-1.5 max-h-[180px] overflow-y-auto bg-slate-950/60 p-2.5 rounded-lg border border-slate-850">
                    {bins.map((bin) => {
                      const isChecked = selectedBinIds.includes(bin.id);
                      return (
                        <div
                          key={bin.id}
                          onClick={() => handleToggleSelectBin(bin.id)}
                          className={`flex justify-between items-center p-2 rounded border cursor-pointer text-xs transition-all ${
                            isChecked
                              ? 'bg-cyan-950/40 border-cyan-500/30'
                              : 'bg-slate-950/40 border-slate-900 hover:bg-slate-900/40'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] text-white ${
                              bin.fillLevel > 90 ? 'bg-rose-500' : 'bg-emerald-500'
                            }`}>
                              {bin.fillLevel}
                            </div>
                            <span className="font-semibold text-slate-200">{bin.name}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500 font-mono">{bin.weightKg}kg</span>
                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                              isChecked ? 'border-cyan-400 bg-cyan-950 text-cyan-400' : 'border-slate-800'
                            }`}>
                              {isChecked && <Check className="w-3 h-3" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isOptimizing || selectedBinIds.length === 0}
                className="w-full bg-cyan-500 text-slate-950 font-bold py-3 rounded-lg text-xs md:text-sm hover:bg-cyan-400 disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-md"
              >
                {isOptimizing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Executing Optimization Model...</span>
                  </>
                ) : (
                  <>
                    <Navigation className="w-4.5 h-4.5" />
                    <span>Compile & Dispatch Smart Route</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Active routes checklist */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3.5">
              <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest">Active Dispatch Loggers</h3>
              
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {routes.map((r) => {
                  const statusColors = {
                    'Ready': 'bg-blue-950/40 text-blue-400 border-blue-900/30',
                    'In Progress': 'bg-amber-950/40 text-amber-400 border-amber-900/30 animate-pulse',
                    'Completed': 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30'
                  };

                  return (
                    <div key={r.id} className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-bold text-slate-200 text-xs md:text-sm">{r.routeName}</p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">ALGO MODEL: {r.optimizeAlgo} • CARRIER: {r.driverName}</p>
                        </div>
                        <span className={`text-[9px] px-2.5 py-0.5 font-bold font-mono rounded border ${statusColors[r.status]}`}>
                          {r.status}
                        </span>
                      </div>

                      {/* Info metrics */}
                      <div className="grid grid-cols-3 gap-2 bg-slate-900/40 p-2 rounded-lg border border-slate-850 text-center text-xs">
                        <div>
                          <p className="text-[9px] text-slate-500 uppercase font-mono">STOPS</p>
                          <p className="font-semibold text-slate-200 mt-0.5">{r.stopsCount}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-500 uppercase font-mono">EST DISTANCE</p>
                          <p className="font-semibold text-slate-200 mt-0.5">{r.totalDistanceKm}km</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-500 uppercase font-mono">DRIVE TIME</p>
                          <p className="font-semibold text-slate-200 mt-0.5">{r.estimatedTimeMin} min</p>
                        </div>
                      </div>

                      {/* Display Stops */}
                      <div className="space-y-1.5 pt-1.5 border-t border-slate-900">
                        <p className="text-[9px] text-slate-400 uppercase font-mono tracking-wider">Logistics checklist sequence:</p>
                        <div className="space-y-1 pl-1 text-[11px] font-mono text-slate-400">
                          {r.points.map((pt) => (
                            <div key={pt.order} className="flex items-center gap-2">
                              <span className="w-4 h-4 rounded-full bg-slate-800 text-[9px] text-white flex items-center justify-center font-bold">
                                {pt.order}
                              </span>
                              <span className="truncate">{pt.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. CCTV ILLEGAL DUMPING ALERTS */}
      {activeTab === 'cctv' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-100 uppercase tracking-wider font-mono">CCTV Computer Vision Feeds</h3>
                <p className="text-xs text-slate-500 mt-0.5">Municipal AI monitors public garbage cans and hotspots for illegal debris dumping and unauthorized discharges.</p>
              </div>

              <div className="space-y-3.5">
                {alerts.map((alert) => {
                  const severityStyles = {
                    Low: 'bg-blue-950/30 text-blue-400 border-blue-900/30',
                    Medium: 'bg-yellow-950/30 text-yellow-400 border-yellow-900/30',
                    High: 'bg-rose-950/40 text-rose-400 border-rose-900/30',
                    Critical: 'bg-red-950/40 text-red-400 border-red-900/30 animate-pulse-slow'
                  };

                  return (
                    <div
                      key={alert.id}
                      className={`p-4 bg-slate-950/80 border rounded-xl space-y-3 transition-opacity ${
                        alert.status === 'Cleared' ? 'opacity-50' : 'opacity-100'
                      }`}
                    >
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-200 text-xs md:text-sm">{alert.locationName}</span>
                            <span className={`text-[8px] font-mono px-2 py-0.5 rounded-full font-black border ${severityStyles[alert.severity]}`}>
                              {alert.severity} SEVERITY
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-mono">REPORTED CODE: {alert.id} • SOURCE: {alert.reportedBy}</p>
                        </div>

                        <span className={`text-[10px] uppercase font-mono px-2 py-1 rounded font-black ${
                          alert.status === 'Unresolved'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : alert.status === 'Investigating'
                            ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {alert.status}
                        </span>
                      </div>

                      <div className="p-3 bg-slate-900/70 border border-slate-850 rounded-lg text-xs leading-relaxed text-slate-300 flex gap-3.5 items-start">
                        <ShieldAlert className="w-6 h-6 text-rose-500 shrink-0" />
                        <div>
                          <p className="font-mono text-slate-300 font-semibold uppercase text-[10px] tracking-wider text-rose-400 mb-0.5">AI CCTV TELEMETRY NOTE</p>
                          <p className="italic font-sans text-slate-400">"{alert.description}"</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center flex-wrap pt-2 border-t border-slate-900 text-[10px] text-slate-500">
                        <span>Report time: {new Date(alert.reportTime).toLocaleTimeString()}</span>
                        
                        {alert.status !== 'Cleared' && (
                          <button
                            type="button"
                            onClick={() => onClearAlert(alert.id)}
                            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-3 py-1.5 rounded text-[10px] font-mono transition-colors"
                          >
                            DEPLOY CLEARANCE TEAM
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* CCTV Hardware Spec sheets */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest">CCTV Camera Health</h3>
              
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center p-2.5 bg-slate-950 rounded-lg border border-slate-850">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="font-semibold text-slate-200">Cam SF-101 (Lombard)</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">98% UP</span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-slate-950 rounded-lg border border-slate-850">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="font-semibold text-slate-200">Cam SF-204 (Financial)</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">100% UP</span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-slate-950 rounded-lg border border-slate-850">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span className="font-semibold text-slate-200">Cam SF-950 (SOMA)</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">81% UP</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. FUTURE VOLUME LEADS & DEMAND PREDICTIONS */}
      {activeTab === 'predictions' && (
        <div className="space-y-6">
          {/* AI Municipal warning notes */}
          <div className="bg-gradient-to-r from-cyan-900/30 to-slate-900 p-5 rounded-2xl border border-cyan-500/20 shadow-md">
            <div className="flex items-center gap-2 text-cyan-400 mb-1.5">
              <Sparkles className="w-5 h-5 animate-pulse" />
              <h3 className="font-bold text-sm uppercase tracking-wider font-mono">Gemini AI Municipal Predictive Insight</h3>
            </div>
            {loadingPredictions ? (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Extracting smart forecast matrices from Gemini...</span>
              </div>
            ) : (
              <p className="text-xs md:text-sm text-slate-300 leading-relaxed italic pr-2 font-mono">
                "{aiWarning}"
              </p>
            )}
          </div>

          {/* Charts view */}
          {predictions ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Chart A: Daily load forecast */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4">
                <h4 className="text-xs font-mono text-slate-400 uppercase tracking-widest">Next Week: Projected Daily Generation (Kg)</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={predictions.dailyGenerations}>
                      <defs>
                        <linearGradient id="colorKgs" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="day" stroke="#475569" fontSize={11} fontStyle="italic" />
                      <YAxis stroke="#475569" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} labelStyle={{ color: '#94a3b8' }} />
                      <Area type="monotone" dataKey="predictedKgs" name="Predicted weight (Kg)" stroke="#22d3ee" fillOpacity={1} fill="url(#colorKgs)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart B: Category ratios */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4">
                <h4 className="text-xs font-mono text-slate-400 uppercase tracking-widest">Metropolitan Stream Material Composition Ratio (%)</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={predictions.categoriesRatio} layout="vertical">
                      <XAxis type="number" stroke="#475569" fontSize={10} />
                      <YAxis dataKey="category" type="category" stroke="#475569" fontSize={11} width={130} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} labelStyle={{ color: '#94a3b8' }} />
                      <Bar dataKey="value" name="Composition (%)" fill="#10b981" radius={[0, 4, 4, 0]}>
                        {predictions.categoriesRatio.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-24 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-slate-600" />
              <p className="text-xs">Processing demand volumes forecasting data...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
