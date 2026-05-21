import React from 'react';
import { Map, Crosshair } from 'lucide-react';

const ThreatHeatmap = () => {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl p-6 h-150 flex flex-col">
      <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        <Map className="text-[#20C997] size-5" /> Active Node Grid (Sector 4)
      </h2>
      
      <div className="relative flex-1 bg-[#040a06]/50 rounded-xl border border-white/5 overflow-hidden">
        {/* Radar grid lines */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size-[40px_40px]"></div>
        
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <Crosshair className="size-32 text-white/10 animate-spin-slow" />
        </div>

        {/* Mock Nodes */}
        {/* Safe Node */}
        <div className="absolute top-1/4 left-1/3 flex flex-col items-center">
          <span className="relative flex size-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#20C997] opacity-75"></span>
            <span className="relative inline-flex rounded-full size-4 bg-[#20C997]"></span>
          </span>
          <span className="text-[10px] text-[#20C997] mt-1 font-mono">Node_Alpha (Safe)</span>
        </div>

        {/* Threat Node */}
        <div className="absolute top-2/3 right-1/4 flex flex-col items-center">
          <span className="relative flex size-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full size-5 bg-red-500"></span>
          </span>
          <span className="text-[10px] text-red-400 mt-1 font-mono font-bold bg-red-500/10 px-1 rounded">THREAT DETECTED</span>
        </div>
      </div>
    </div>
  );
};

export default ThreatHeatmap;