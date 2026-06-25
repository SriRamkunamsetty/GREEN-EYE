import React, { useState, useRef } from 'react';
import { Leaf, Camera, Calendar, Trophy, Send, Award, Trash, Trash2, MapPin, Sparkles, Upload, Loader2, ArrowRight } from 'lucide-react';
import { WasteItem, User, PickupRequest } from '../types';

interface CitizenPanelProps {
  currentUser: User;
  users: User[];
  wasteHistory: WasteItem[];
  pickups: PickupRequest[];
  onScanComplete: (item: WasteItem) => void;
  onPickupScheduled: (newPickup: PickupRequest) => void;
  isScanning: boolean;
  setIsScanning: (scanning: boolean) => void;
  onRefreshUsers: () => void;
}

export default function CitizenPanel({
  currentUser,
  users,
  wasteHistory,
  pickups,
  onScanComplete,
  onPickupScheduled,
  isScanning,
  setIsScanning,
  onRefreshUsers
}: CitizenPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<'scanner' | 'scheduler' | 'impact' | 'leaderboard'>('scanner');
  const [textPrompt, setTextPrompt] = useState('');
  const [imageSample, setImageSample] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [scanningStatus, setScanningStatus] = useState('');

  // Pickup fields
  const [materials, setMaterials] = useState('');
  const [estimatedWeight, setEstimatedWeight] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [address, setAddress] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preloaded simulation items for the citizen camera simulator
  const SIMULATION_PRESETS = [
    { title: 'Aluminum Can', text: 'Crushed Diet Coke Soda Can, 12oz', image: 'https://images.unsplash.com/photo-1536924430914-91f9e2041b83?auto=format&fit=crop&q=80&w=200' },
    { title: 'Plastic Drink Bottle', text: 'Transparent PET water bottle, label wrapper attached', image: 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?auto=format&fit=crop&q=80&w=200' },
    { title: 'Surgical Face Mask', text: 'Blue disposable surgical 3-ply earloop face mask', image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=200' },
    { title: 'Corrugated Pizza Box', text: 'Empty grease stained organic pizza cardboard delivery container', image: 'https://images.unsplash.com/photo-1544982503-9f984c14501a?auto=format&fit=crop&q=80&w=200' },
    { title: 'Lithium AA batteries', text: 'Set of four alkaline AA cells, leaking slightly', image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=200' },
  ];

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageSample(event.target.result as string);
        setTextPrompt(file.name.split('.')[0]);
      }
    };
    reader.readAsDataURL(file);
  };

  // Run Classification API
  const handleClassification = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!textPrompt && !imageSample) return;

    setIsScanning(true);
    setScanningStatus('Activating computer vision models...');

    try {
      setTimeout(() => setScanningStatus('Analyzing structural metrics & material density...'), 1000);
      setTimeout(() => setScanningStatus('Grounding coordinates for recycling centers...'), 2000);

      const response = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imageSample || '',
          textPrompt: textPrompt || 'Household material scrap',
          citizenId: currentUser.id
        })
      });

      const data = await response.json();
      if (data.success) {
        onScanComplete(data.item);
        // Clear scanner fields
        setTextPrompt('');
        setImageSample(null);
        setActiveSubTab('impact'); // switch to history to view results
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsScanning(false);
      setScanningStatus('');
    }
  };

  // Schedule pickup
  const handleSchedulePickup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materials || !estimatedWeight || !scheduledDate || !address) return;

    setIsScheduling(true);
    try {
      const response = await fetch('/api/pickups/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          citizenId: currentUser.id,
          citizenName: currentUser.name,
          materials,
          estimatedWeightKg: parseFloat(estimatedWeight),
          scheduledTime: new Date(scheduledDate).toISOString(),
          address,
          latitude: 37.7749 + (Math.random() - 0.5) * 0.03, // Simulated local coordinate
          longitude: -122.4194 + (Math.random() - 0.5) * 0.03
        })
      });

      const data = await response.json();
      if (data.success) {
        onPickupScheduled(data.pickup);
        setMaterials('');
        setEstimatedWeight('');
        setScheduledDate('');
        setAddress('');
        onRefreshUsers(); // Award points
        alert(`Pickup Scheduled successfully! You earned estimated Green Points.`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsScheduling(false);
    }
  };

  // Calculate environmental impacts accumulated
  const totalCarbonSaved = wasteHistory.reduce((acc, curr) => acc + curr.carbonSavedKg, 0);
  const recycledCount = wasteHistory.filter(i => i.recyclable).length;

  return (
    <div id="citizen-dashboard" className="space-y-6">
      {/* Dynamic SubNavigation tabs */}
      <div className="flex bg-slate-900 p-1.5 rounded-xl border border-slate-800/80 gap-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSubTab('scanner')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${
            activeSubTab === 'scanner'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Camera className="w-4 h-4" />
          AI Scanner Agent
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('scheduler')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${
            activeSubTab === 'scheduler'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Pickup Scheduler
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('impact')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${
            activeSubTab === 'impact'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Award className="w-4 h-4" />
          My Eco Diary ({wasteHistory.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('leaderboard')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${
            activeSubTab === 'leaderboard'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Trophy className="w-4 h-4" />
          City Leaderboard
        </button>
      </div>

      {/* Citizen header rewards bar */}
      <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800/60 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-xs font-mono text-slate-400 uppercase tracking-widest">SUSTAINABILITY WALLET</h4>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
                {currentUser.points}
              </span>
              <span className="text-xs text-slate-400 font-mono">Green Points</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentUser.badges.map((badge, idx) => (
            <span
              key={idx}
              className="bg-emerald-950/80 text-emerald-300 border border-emerald-800/40 px-3 py-1 rounded-full text-[10px] font-mono tracking-wide font-bold inline-flex items-center gap-1 shadow-sm"
            >
              <Sparkles className="w-3 h-3" />
              {badge}
            </span>
          ))}
          {currentUser.badges.length === 0 && (
            <span className="text-slate-500 text-xs italic">Earn badges by scanning recyclable material</span>
          )}
        </div>
      </div>

      {/* RENDER ACTIVE TAB */}

      {/* 1. CAMERA & AI CLASSIFICATION SCANNER */}
      {activeSubTab === 'scanner' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            <form onSubmit={handleClassification} className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Camera className="text-emerald-400 w-5 h-5" />
                  Smart Computer Vision Scan
                </h3>
                <span className="text-[10px] font-mono bg-emerald-900/40 text-emerald-300 px-2.5 py-0.5 rounded font-bold border border-emerald-800/30">
                  REAL-TIME Segregator
                </span>
              </div>

              {/* Upload Stage / Drag and drop */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-emerald-400 bg-emerald-950/10'
                    : 'border-slate-800 hover:border-emerald-500/40 bg-slate-950/50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />

                {imageSample ? (
                  <div className="relative max-w-xs mx-auto rounded-lg overflow-hidden border border-slate-800 shadow-xl">
                    <img src={imageSample} alt="Scan specimen" className="w-full h-40 object-cover" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImageSample(null);
                      }}
                      className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-full border border-slate-700 text-rose-400 hover:bg-slate-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center mx-auto border border-slate-800">
                      <Upload className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-200 font-semibold">
                        Drag and drop waste image here, or <span className="text-emerald-400">browse file</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-1">Supports JPEG, png, camera uploads up to 10MB</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Alternate text label input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-slate-400 uppercase">SPECIMEN DESCRIPTION (MANUAL INPUT BACKUP)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={textPrompt}
                    onChange={(e) => setTextPrompt(e.target.value)}
                    placeholder="e.g., Transparent plastic juice flask or crushed card container"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-3 pr-10 text-xs md:text-sm font-sans text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                  {textPrompt && (
                    <button
                      type="button"
                      onClick={() => setTextPrompt('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs font-mono"
                    >
                      clear
                    </button>
                  )}
                </div>
              </div>

              {/* Action trigger button */}
              <button
                type="submit"
                disabled={isScanning || (!textPrompt && !imageSample)}
                className="w-full bg-emerald-500 text-slate-950 font-bold py-3 px-4 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{scanningStatus || 'Analyzing specimen...'}</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4.5 h-4.5" />
                    <span>Deploy AI Recognition Engine</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="lg:col-span-5 space-y-6">
            {/* Specimen Simulator Presets */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-3.5">
              <div>
                <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider">SPECIMEN SANITATION PLAYGROUND</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Don't have a camera image ready? Select an interactive sample to test the AI engine:</p>
              </div>

              <div className="space-y-2.5">
                {SIMULATION_PRESETS.map((p, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => {
                      setImageSample(p.image);
                      setTextPrompt(p.title);
                    }}
                    className="w-full flex items-center gap-3 bg-slate-950 hover:bg-slate-850 p-2.5 rounded-xl border border-slate-800/80 hover:border-emerald-500/35 text-left transition-all"
                  >
                    <img src={p.image} alt={p.title} className="w-12 h-12 rounded-lg object-cover border border-slate-800" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-200">{p.title}</p>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">{p.text}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. PICKUP SCHEDULER */}
      {activeSubTab === 'scheduler' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <form onSubmit={handleSchedulePickup} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-200">Schedule Municipal Cargo Pickup</h3>
                <p className="text-xs text-slate-500 mt-1">Book a weight-based trash haul. Collection teams will gather cargo and transfer points to your wallet upon verification.</p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono text-slate-400 uppercase">Description of Scrap Materials</label>
                  <textarea
                    value={materials}
                    onChange={(e) => setMaterials(e.target.value)}
                    rows={2}
                    required
                    placeholder="e.g. 50kg dry newspapers, 10 bulk aluminum frames, 1 broken refrigerator"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs md:text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono text-slate-400 uppercase">Estimated Total Weight (Kg)</label>
                    <input
                      type="number"
                      value={estimatedWeight}
                      onChange={(e) => setEstimatedWeight(e.target.value)}
                      required
                      min={1}
                      placeholder="e.g., 25"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono text-slate-400 uppercase">Target Date of Collection</label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono text-slate-400 uppercase">Full Collection Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    placeholder="Street No, Apartment, ZIP Code"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isScheduling}
                className="w-full bg-emerald-500 text-slate-950 font-bold py-3 rounded-lg text-xs md:text-sm hover:bg-emerald-400 flex items-center justify-center gap-2"
              >
                {isScheduling && <Loader2 className="w-4.5 h-4.5 animate-spin" />}
                <span>{isScheduling ? 'Booking dispatch order...' : 'Confirm pickup appointment'}</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-5 space-y-6">
            {/* Booked Appointments logs */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider">ACTIVE DISPATCH ORDERS</h4>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {pickups.filter(p => p.citizenId === currentUser.id).map((p) => {
                  const statusColors = {
                    Pending: 'bg-yellow-900/40 text-yellow-300 border-yellow-800/30',
                    Scheduled: 'bg-blue-900/40 text-blue-300 border-blue-800/30',
                    Assigned: 'bg-purple-900/40 text-purple-300 border-purple-800/30',
                    Collected: 'bg-emerald-900/40 text-emerald-300 border-emerald-800/30'
                  };

                  return (
                    <div key={p.id} className="bg-slate-950 border border-slate-850 p-3 rounded-xl space-y-2">
                      <div className="flex justify-between items-start">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold border ${statusColors[p.status]}`}>
                          {p.status}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono font-bold">+{p.pointsAwarded} Pts pending</span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-200 line-clamp-1">{p.materials}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{p.address}</p>
                      </div>
                      <div className="flex justify-between items-center text-[10px] pt-1.5 border-t border-slate-900 text-slate-400">
                        <span>Weight: {p.estimatedWeightKg}kg</span>
                        <span>Date: {new Date(p.scheduledTime).toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                })}

                {pickups.filter(p => p.citizenId === currentUser.id).length === 0 && (
                  <p className="text-xs text-slate-500 italic text-center py-8">No scheduled collection loads yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. MY ENVIRONMENTAL IMPACT LOGS */}
      {activeSubTab === 'impact' && (
        <div className="space-y-6">
          {/* Carbon Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase">
                <span>TOTAL CO₂ MITIGATED</span>
                <Leaf className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-3xl font-extrabold text-white mt-2">
                {totalCarbonSaved.toFixed(1)} <span className="text-sm font-normal text-slate-400">Kg</span>
              </p>
              <div className="text-[10px] text-slate-500 mt-1.5 font-mono">
                Equivalent to planted {Math.max(1, Math.round(totalCarbonSaved / 0.5))} urban tree saplings.
              </div>
            </div>

            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase">
                <span>SEGREGATION ACCURACY</span>
                <Trophy className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-3xl font-extrabold text-white mt-2">
                {wasteHistory.length > 0 ? (recycledCount / wasteHistory.length * 100).toFixed(0) : '0'}<span className="text-sm font-normal text-slate-400">%</span>
              </p>
              <div className="text-[10px] text-slate-500 mt-1.5 font-mono">
                Based on clean recycling stream standards.
              </div>
            </div>

            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase">
                <span>TOTAL SCRAWL SPECIES</span>
                <Trash2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-3xl font-extrabold text-white mt-2">{wasteHistory.length}</p>
              <div className="text-[10px] text-slate-500 mt-1.5 font-mono">
                Materials logged into municipal database.
              </div>
            </div>
          </div>

          {/* Historical classification speciment logs */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest font-mono mb-4">SPECIMENS LOG</h3>

            <div className="space-y-4">
              {wasteHistory.map((item) => {
                const badgeCats = {
                  Plastic: 'bg-yellow-950/40 text-yellow-400 border-yellow-800/20',
                  Paper: 'bg-blue-950/40 text-blue-400 border-blue-800/20',
                  Glass: 'bg-emerald-950/40 text-emerald-400 border-emerald-800/20',
                  Metal: 'bg-slate-950/40 text-slate-300 border-slate-800/20',
                  Organic: 'bg-green-950/40 text-green-300 border-green-800/20',
                  'E-Waste': 'bg-cyan-950/50 text-cyan-300 border-cyan-800/20',
                  Hazardous: 'bg-rose-950/40 text-rose-300 border-rose-800/20',
                  Medical: 'bg-red-950/40 text-red-300 border-red-800/20',
                };

                return (
                  <div key={item.id} className="bg-slate-950/60 p-4 rounded-xl border border-slate-850 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <div className="space-y-2 max-w-xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-100 text-sm">{item.object}</span>
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${badgeCats[item.category] || 'bg-slate-800 text-slate-300'}`}>
                          {item.category}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Confidence: {item.confidence.toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{item.disposalMethod}</p>
                      
                      {item.recyclingCenterName && (
                        <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono bg-emerald-950/30 w-fit px-2 py-1 rounded">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Center: {item.recyclingCenterName} ({item.recyclingCenterDistance})</span>
                        </div>
                      )}
                    </div>

                    <div className="text-right flex flex-row md:flex-col gap-4 md:gap-1 items-center md:items-end justify-between w-full md:w-auto border-t border-slate-950 md:border-0 pt-2 md:pt-0">
                      <div>
                        {item.recyclable ? (
                          <span className="text-[10px] bg-emerald-900/30 text-emerald-300 px-2.5 py-0.5 rounded font-bold font-mono">
                            RECYCLABLE
                          </span>
                        ) : (
                          <span className="text-[10px] bg-rose-900/30 text-rose-300 px-2.5 py-0.5 rounded font-bold font-mono">
                            NON-RECYCLABLE
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-mono text-slate-400 mt-1">
                        +{(item.carbonSavedKg).toFixed(2)}kg CO₂ saved
                      </p>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}

              {wasteHistory.length === 0 && (
                <p className="text-xs text-slate-500 italic text-center py-12">Scan your first scrap item above to begin accumulating and monitoring environment goals.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. CITY-WIDE GAMIFICATION LEADERBOARD */}
      {activeSubTab === 'leaderboard' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-200">Municipal Eco Leaderboard</h3>
            <p className="text-xs text-slate-500 mt-1">Real-time standings of citizens taking active efforts in waste segregation and recycling across SOMA, Marina, and Mission Districts.</p>
          </div>

          <div className="space-y-2">
            {[...users]
              .sort((a, b) => b.points - a.points)
              .map((user, idx) => (
                <div
                  key={user.id}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                    user.id === currentUser.id
                      ? 'bg-emerald-950/30 border-emerald-500/30 shadow-lg'
                      : 'bg-slate-950/60 border-slate-900 hover:bg-slate-900/40'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    {/* Rank Indicator */}
                    <span className="w-6 text-center font-mono font-bold text-sm text-slate-400">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs md:text-sm font-bold text-slate-200">{user.name}</span>
                        {user.id === currentUser.id && (
                          <span className="bg-emerald-500 text-slate-950 text-[8px] uppercase px-1.5 py-0.2 rounded font-black font-mono">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1.5 mt-1 flex-wrap">
                        {user.badges.map((b, i) => (
                          <span key={i} className="text-[8px] font-mono tracking-wider bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded">
                            {b}
                          </span>
                        ))}
                        {user.badges.length === 0 && (
                          <span className="text-[8px] text-slate-600 italic">No eco Badges</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-bold text-emerald-400 font-mono">
                      {user.points.toLocaleString()}
                    </span>
                    <p className="text-[8px] text-slate-500 font-mono">Credits</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
