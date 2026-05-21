import React from 'react';
import { Activity, Bird, TreePine } from 'lucide-react';
import { motion } from 'framer-motion';

const BiodiversityScore = ({ logs = [] }) => {
  // --- DEMO BASELINES (So the dashboard looks massive and active) ---
  const BASE_EVENTS = 1400;
  const BASE_SPECIES = 122;
  const BASE_HEALTH = 98;

  // 1. Calculate Total Events (Baseline + your live SQLite uploads)
  const totalEvents = BASE_EVENTS + logs.length;
  
  // 2. Safely filter for real animals (Fixing the uppercase/lowercase bug!)
  const safeLogs = logs.filter(log => {
    if (log.alert) return false; // Ignore threats
    const pred = log.prediction ? log.prediction.toLowerCase() : '';
    return !pred.includes('background'); // Safely ignore "Background", "background_noise", etc.
  });
  
  // 3. Count unique live species added during your demo
  const uniqueLiveSpeciesList = [...new Set(safeLogs.map(log => log.prediction))];
  const uniqueSpeciesCount = BASE_SPECIES + uniqueLiveSpeciesList.length;

  // 4. Calculate Health Score: Drops by 7 points for every real threat uploaded
  const threatCount = logs.filter(log => log.alert).length;
  const ecosystemHealth = Math.max(0, BASE_HEALTH - (threatCount *5 ));

  // Determine trend text
  const isHealthy = ecosystemHealth >= 80;
  
  return (
    <div className="mt-6 max-w-5xl mx-auto space-y-6">
      
      {/* Top Main Score Card */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-1/2 h-full opacity-20 pointer-events-none flex items-end justify-end p-4 gap-2">
          {/* Simulated Activity Bars */}
          {[40, 60, 45, 80, 55, 90, 70].map((h, i) => (
            <div key={i} className="w-12 bg-[#20C997] rounded-t-sm" style={{ height: `${h}%` }}></div>
          ))}
        </div>

        <h2 className="text-lg font-medium text-emerald-100/70 mb-2">Overall Ecosystem Health</h2>
        <div className="flex items-baseline gap-2">
          <span className="text-7xl font-bold text-white tracking-tighter">{ecosystemHealth}</span>
          <span className="text-xl text-emerald-100/50">/100</span>
        </div>
        
        <p className={`mt-4 text-sm font-medium ${isHealthy ? 'text-[#20C997]' : 'text-red-400'}`}>
          {isHealthy ? '+ Stable Acoustic Environment' : '- High Threat Activity Detected'}
        </p>
      </div>

      {/* Bottom Three Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
          <Bird className="text-[#20C997] size-6 mb-4" />
          <div className="text-3xl font-bold text-white">{uniqueSpeciesCount}</div>
          <div className="text-sm text-emerald-100/60 mt-1">Unique Species Logged</div>
          
          {/* Dynamically display the latest animal found! */}
          {uniqueLiveSpeciesList.length > 0 && (
            <div className="text-xs text-[#20C997] mt-3 bg-[#20C997]/10 inline-block px-2 py-1 rounded">
              Latest: {uniqueLiveSpeciesList[0].toUpperCase()}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
          <Activity className="text-[#20C997] size-6 mb-4" />
          <div className="text-3xl font-bold text-white">{totalEvents.toLocaleString()}</div>
          <div className="text-sm text-emerald-100/60 mt-1">Acoustic Events Today</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
          <TreePine className="text-[#20C997] size-6 mb-4" />
          <div className="text-3xl font-bold text-white">
            {ecosystemHealth >= 98 ? '99.8%' : `${(99.8 - (threatCount * 0.4)).toFixed(1)}%`}
          </div>
          <div className="text-sm text-emerald-100/60 mt-1">Forest Cover Intact</div>
        </motion.div>
      </div>

    </div>
  );
};

export default BiodiversityScore;