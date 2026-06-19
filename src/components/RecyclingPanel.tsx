import React, { useState, useEffect } from 'react';
import { MarketplaceListing, MarketplaceTransaction, User } from '../types';
import { ShoppingBag, ArrowRight, CheckCircle2, DollarSign, Store, Tag, Compass, Sparkles, Building2, Loader2 } from 'lucide-react';

interface RecyclingPanelProps {
  currentUser: User;
  users: User[];
  listings: MarketplaceListing[];
  transactions: MarketplaceTransaction[];
  onPurchaseListing: (listingId: string) => void;
  onAddListing: (payload: any) => void;
}

export default function RecyclingPanel({
  currentUser,
  users,
  listings,
  transactions,
  onPurchaseListing,
  onAddListing
}: RecyclingPanelProps) {
  const [activeMarketTab, setActiveMarketTab] = useState<'listings' | 'transactions' | 'sell'>('listings');
  
  // Sell Form values
  const [sellTitle, setSellTitle] = useState('');
  const [sellMaterial, setSellMaterial] = useState('');
  const [sellCategory, setSellCategory] = useState('Plastic');
  const [sellWeight, setSellWeight] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [sellDesc, setSellDesc] = useState('');
  const [isEstimating, setIsEstimating] = useState(false);

  // Auto AI Quote calculation
  const handleEstimatePrice = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!sellWeight || !sellMaterial) {
      alert("Please input the weight and material specification first.");
      return;
    }
    
    setIsEstimating(true);
    setTimeout(() => {
      // AI Price estimation based on material metrics
      const weightBonus = parseFloat(sellWeight) || 10;
      let rateMultiplier = 3.5; // default base rate per kg
      
      const mat = sellMaterial.toLowerCase();
      if (mat.includes('metal') || mat.includes('copper') || mat.includes('aluminum')) rateMultiplier = 8.5;
      else if (mat.includes('cardboard') || mat.includes('paper')) rateMultiplier = 2.2;
      else if (mat.includes('plastic') || mat.includes('pet') || mat.includes('hdpe')) rateMultiplier = 4.0;
      else if (mat.includes('battery') || mat.includes('e-waste')) rateMultiplier = 12.0;

      const calculatedCredits = Math.round(weightBonus * rateMultiplier);
      setSellPrice(calculatedCredits.toString());
      setIsEstimating(false);
      alert(`AI Quote Estimator: Fair Value computed based on secondary commodity markets! Ready to post.`);
    }, 1200);
  };

  const handlePostListing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellTitle || !sellMaterial || !sellWeight || !sellPrice || !sellDesc) return;

    onAddListing({
      sellerId: currentUser.id,
      sellerName: currentUser.name,
      title: sellTitle,
      materialType: sellMaterial,
      category: sellCategory,
      estimatedWeightKg: parseFloat(sellWeight),
      askingPriceCredits: parseInt(sellPrice),
      description: sellDesc,
      lat: 37.7749 + (Math.random() - 0.5) * 0.03,
      lng: -122.4194 + (Math.random() - 0.5) * 0.03
    });

    setSellTitle('');
    setSellMaterial('');
    setSellWeight('');
    setSellPrice('');
    setSellDesc('');
    
    alert("Material posted on circular economy marketplace successfully!");
    setActiveMarketTab('listings');
  };

  return (
    <div className="space-y-6">
      {/* Marketplace Selector SubNav */}
      <div className="flex bg-slate-900 p-1.5 rounded-xl border border-slate-800/80 gap-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveMarketTab('listings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${
            activeMarketTab === 'listings'
              ? 'bg-emerald-500 text-slate-950 font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-850'
          }`}
        >
          <Store className="w-4 h-4" />
          Circular Marketplace
        </button>
        <button
          type="button"
          onClick={() => setActiveMarketTab('sell')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${
            activeMarketTab === 'sell'
              ? 'bg-emerald-500 text-slate-950 font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-850'
          }`}
        >
          <Tag className="w-4 h-4" />
          Sell Recyclables
        </button>
        <button
          type="button"
          onClick={() => setActiveMarketTab('transactions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${
            activeMarketTab === 'transactions'
              ? 'bg-emerald-500 text-slate-950 font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-850'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          Circular Ledger ({transactions.length})
        </button>
      </div>

      {/* RENDER VIEW */}

      {/* 1. LISTINGS */}
      {activeMarketTab === 'listings' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 p-4 border border-slate-850 rounded-xl">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest font-mono">Available Recyclable Streams</h3>
            <p className="text-xs text-slate-500 mt-1">Acquire sorted materials posted by citizens. Raw inputs will automatically replenish your recycling inventories when collected.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {listings.map((list) => {
              const isAvailable = list.status === 'Available';
              const ownsListing = list.sellerId === currentUser.id;

              return (
                <div
                  key={list.id}
                  className={`border rounded-2xl p-5 space-y-4 flex flex-col justify-between transition-all ${
                    isAvailable
                      ? 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/35'
                      : 'bg-slate-950/40 border-slate-900 opacity-65'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="bg-slate-950 text-slate-400 text-[10px] font-mono px-2.5 py-1 rounded border border-slate-800">
                        {list.category}
                      </span>
                      <div className="text-right">
                        <span className="text-emerald-400 font-bold font-mono text-sm block">
                          {list.askingPriceCredits} Pts
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono">Value</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-100 text-sm md:text-base line-clamp-1">{list.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">By {list.sellerName} • {list.estimatedWeightKg}kg</p>
                    </div>

                    <p className="text-xs text-slate-400 bg-slate-950/80 p-2.5 rounded-lg border border-slate-850/60">
                      {list.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-850 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-500">
                      Posted: {new Date(list.timestamp).toLocaleDateString()}
                    </span>

                    {isAvailable ? (
                      ownsListing ? (
                        <span className="text-[10px] text-slate-500 font-mono italic">YOUR LISTING</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onPurchaseListing(list.id)}
                          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 shadow-md"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          PURCHASE stream
                        </button>
                      )
                    ) : (
                      <span className="text-[10px] text-rose-400 font-mono font-bold bg-rose-950/30 px-2 py-0.5 rounded border border-rose-900/10">
                        ACQUIRED
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {listings.length === 0 && (
              <p className="text-xs text-slate-500 italic text-center py-12 md:col-span-2">No material marketplace entries available right now.</p>
            )}
          </div>
        </div>
      )}

      {/* 2. SELL RECYCLABLES */}
      {activeMarketTab === 'sell' && (
        <form onSubmit={handlePostListing} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 max-w-2xl mx-auto">
          <div>
            <h3 className="text-base font-bold text-slate-200 uppercase tracking-widest font-mono">Post Recyclable Stream</h3>
            <p className="text-xs text-slate-500 mt-1">Convert your clean household scrap inventories into Green Reward Points. Post items for industrial processing depots.</p>
          </div>

          <div className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="block text-xs font-mono text-slate-400">LISTING TITLE</label>
              <input
                type="text"
                value={sellTitle}
                onChange={(e) => setSellTitle(e.target.value)}
                required
                placeholder="e.g., Clean Shuffled Cardboard Bundles"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-slate-400">SPECIFIC MATERIAL TYPE</label>
                <input
                  type="text"
                  value={sellMaterial}
                  onChange={(e) => setSellMaterial(e.target.value)}
                  required
                  placeholder="e.g. HDPE Flakes, Copper wires"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-slate-400">CAPSULE CATEGORY</label>
                <select
                  value={sellCategory}
                  onChange={(e) => setSellCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                >
                  <option value="Plastic">Plastic</option>
                  <option value="Paper">Paper</option>
                  <option value="Glass">Glass</option>
                  <option value="Metal">Metal</option>
                  <option value="Organic">Organic</option>
                  <option value="E-Waste">E-Waste</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-slate-400">ESTIMATED WEIGHT (Kg)</label>
                <input
                  type="number"
                  value={sellWeight}
                  onChange={(e) => setSellWeight(e.target.value)}
                  required
                  placeholder="e.g. 45"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-mono text-slate-400">ASKING VALUE (GREEN POINTS)</label>
                  <button
                    type="button"
                    onClick={handleEstimatePrice}
                    className="text-[9px] bg-cyan-950 text-cyan-400 border border-cyan-800/40 px-2 py-0.5 rounded font-bold hover:bg-cyan-900 transition-colors"
                  >
                    AI FairQuote Estimator
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(e.target.value)}
                    required
                    placeholder="e.g., 350"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-mono">Pts</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono text-slate-400">ITEM CONDITION DESCRIPTION</label>
              <textarea
                value={sellDesc}
                onChange={(e) => setSellDesc(e.target.value)}
                required
                rows={3}
                placeholder="e.g., Washed and shredded into clean boxes ready for Freight..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-500 text-slate-950 font-bold py-3 rounded-lg text-xs md:text-sm hover:bg-emerald-400 transition-colors"
          >
            List Material Stream
          </button>
        </form>
      )}

      {/* 3. TRANSACTION LEDGER */}
      {activeMarketTab === 'transactions' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest font-mono">Ledger of Circular Trades</h3>

          <div className="space-y-3">
            {transactions.map((tx) => (
              <div key={tx.id} className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex items-center justify-between text-xs md:text-sm font-mono text-slate-300">
                <div className="space-y-1 text-left">
                  <p className="text-[10px] text-slate-500">TRANSACTION ID: {tx.id}</p>
                  <p className="text-slate-200 font-semibold font-sans">{tx.buyerName} purchased material from {tx.sellerName}</p>
                  <p className="text-[10px] text-slate-400">Executed on Circular Chain Ledger</p>
                </div>

                <div className="text-right">
                  <span className="text-emerald-400 font-extrabold">{tx.priceCredits} Pts</span>
                  <p className="text-[9px] text-slate-500">{new Date(tx.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}

            {transactions.length === 0 && (
              <p className="text-xs text-slate-500 italic text-center py-12">No market transaction history recorded on block ledger yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
