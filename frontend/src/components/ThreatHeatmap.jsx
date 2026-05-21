import React, { useState, useEffect } from 'react';
import { Map, Crosshair, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const ThreatHeatmap = ({ logs = [] }) => {
  // NEW: Keep active threats in a local state that React can force to re-render
  const [activeAlerts, setActiveAlerts] = useState([]);

  // NEW: Every single time the main history array changes, recalculate positions immediately
  useEffect(() => {
    const threatsOnly = logs.filter(log => log.alert === true);
    setActiveAlerts(threatsOnly);
  }, [logs]); // Crucial: This dependency array forces the update

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl p-6 mt-6 max-w-5xl mx-auto h-[600px] flex flex-col">
      <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
        <Map className="text-[#20C997] size-5" /> Active Node Grid (Sector 4)
      </h2>

      <div className="relative flex-1 bg-[#040a06]/60 rounded-xl overflow-hidden border border-white/5">
        {/* Background Grid Lines */}
        <div className="absolute inset-0" style={{ 
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', 
          backgroundSize: '40px 40px' 
        }}></div>

        {/* Center Crosshair */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white/10">
          <Crosshair className="w-24 h-24" />
        </div>

        {/* Static Edge Node (Your physical sensor) */}
        <div className="absolute top-[40%] left-[45%] flex flex-col items-center">
          <div className="w-4 h-4 bg-[#20C997] rounded-full shadow-[0_0_15px_#20c997]"></div>
          <span className="text-[10px] text-[#20C997] mt-1 font-mono bg-black/50 px-2 py-0.5 rounded">Node_Alpha (Safe)</span>
        </div>

        {/* Dynamic Threat Nodes from Live Data */}
        {activeAlerts.map((alert, index) => {
          // Use index to predictably scatter multiple threats onto different grid sectors
          const topPos = 65 - ((index * 12) % 35);
          const leftPos = 55 + ((index * 18) % 35);
          
          return (
            <motion.div 
              key={index}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute flex flex-col items-center"
              style={{ top: `${topPos}%`, left: `${leftPos}%` }}
            >
              <div className="relative flex justify-center items-center">
                <div className="absolute w-8 h-8 bg-red-500/30 rounded-full animate-ping"></div>
                <div className="w-4 h-4 bg-red-500 rounded-full shadow-[0_0_15px_#ef4444] z-10 flex items-center justify-center">
                  <AlertCircle className="w-3 h-3 text-white" />
                </div>
              </div>
              <span className="text-[10px] text-red-400 mt-2 font-mono font-bold bg-red-950/80 px-2 py-0.5 rounded border border-red-500/30 whitespace-nowrap">
                {alert.prediction.toUpperCase()}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ThreatHeatmap;