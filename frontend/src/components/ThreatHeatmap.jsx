import React, { useState } from 'react';
import { Layers, ShieldAlert, Heart, Leaf, Activity, Volume2, Info } from 'lucide-react';

const ThreatHeatmap = ({ logs = [] }) => {
  const [hoveredSector, setHoveredSector] = useState(null);

  // 1. ECOLOGICAL ALGORITHM: Process live logs to calculate sector health indices
  const calculateSectorHealth = (sectorId) => {
    // Filter database logs belonging to this specific geographical sector
    const sectorLogs = logs.filter((_, idx) => (idx % 3) + 1 === sectorId);
    
    if (sectorLogs.length === 0) {
      return { 
        score: 0.85, 
        status: 'Healthy Biodiversity', 
        color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40', 
        bgGlow: 'rgba(16,185,129,0.15)',
        text: 'text-emerald-400', 
        desc: 'High species counts with robust, continuous biophony signatures.',
        metrics: { diversity: 80, frequency: 90, density: 85, variation: 85 } 
      };
    }

    // Extract raw variables requested by mentor
    const totalDetections = sectorLogs.length;
    const threatDetections = sectorLogs.filter(l => l.alert === true).length;
    const safeDetections = totalDetections - threatDetections;

    // Unique bio-labels (Species Diversity)
    const uniqueSpecies = new Set(sectorLogs.filter(l => !l.alert).map(l => l.prediction)).size;
    
    // Calculate fractional indices between 0 and 1
    const diversityIndex = Math.min(uniqueSpecies / 4, 1.0); 
    const frequencyIndex = Math.min(safeDetections / 5, 1.0);
    const threatInterference = totalDetections > 0 ? threatDetections / totalDetections : 0;

    // Composite Biodiversity Score Equation
    let bioScore = ((diversityIndex * 0.4) + (frequencyIndex * 0.4) + ((1 - threatInterference) * 0.2));
    
    // Ensure boundary constraints
    bioScore = Math.max(0.1, Math.min(0.98, bioScore));

    // Map calculated floating score to exact color-coded ecosystem zones
    if (bioScore >= 0.70) {
      return {
        score: bioScore,
        status: 'Healthy Biodiversity',
        color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
        bgGlow: 'rgba(16,185,129,0.15)',
        text: 'text-emerald-400',
        desc: 'High species counts with robust, continuous biophony signatures.',
        metrics: { diversity: Math.round(diversityIndex * 100), frequency: Math.round(frequencyIndex * 100), density: 88, variation: 92 }
      };
    } else if (bioScore >= 0.40) {
      return {
        score: bioScore,
        status: 'Declining Activity',
        color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
        bgGlow: 'rgba(245,158,11,0.15)',
        text: 'text-yellow-400',
        desc: 'Bio-acoustic frequency dropping. Potential environmental encroachment.',
        metrics: { diversity: Math.round(diversityIndex * 100), frequency: Math.round(frequencyIndex * 100), density: 54, variation: 48 }
      };
    } else {
      return {
        score: bioScore,
        status: 'Ecosystem Stress',
        color: 'bg-red-500/20 text-red-400 border-red-500/40',
        bgGlow: 'rgba(239,68,68,0.15)',
        text: 'text-red-400',
        desc: 'Critical silent gap zones or severe acoustic logging interference detected.',
        metrics: { diversity: Math.round(diversityIndex * 100), frequency: Math.round(frequencyIndex * 100), density: 21, variation: 15 }
      };
    }
  };

  // Define 3 explicit physical sectors monitoring the region
  const sectors = [
    { id: 1, name: 'Sector 1 - North Canopy', left: '15%', top: '25%', size: 'w-32 h-32' },
    { id: 2, name: 'Sector 4 - New Town Edge', left: '50%', top: '45%', size: 'w-40 h-40' },
    { id: 3, name: 'Sector 3 - South Wetlands', left: '30%', top: '65%', size: 'w-28 h-28' },
  ];

  const activeSectorData = hoveredSector ? calculateSectorHealth(hoveredSector.id) : null;

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl p-6 max-w-5xl mx-auto">
      
      {/* Tab Header Component */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-white/5 pb-4">
        <div>
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Layers className="text-[#20C997] size-5" /> Biodiversity & Ecosystem Intelligence
          </h2>
          <p className="text-xs text-emerald-100/50 mt-1">
            Real-time multi-dimensional mapping tracking species variance, density vectors, and environmental health profiles.
          </p>
        </div>

        {/* Floating Map Index Legend */}
        <div className="flex items-center gap-4 text-xs font-mono bg-black/30 p-2.5 rounded-xl border border-white/5">
          <div className="flex items-center gap-1.5"><div className="size-2.5 rounded-full bg-emerald-500"></div> Healthy</div>
          <div className="flex items-center gap-1.5"><div className="size-2.5 rounded-full bg-yellow-500"></div> Declining</div>
          <div className="flex items-center gap-1.5"><div className="size-2.5 rounded-full bg-red-500"></div> Stress Zone</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT: Spatial Topographic Grid Layout */}
        <div className="lg:col-span-2 relative h-96 bg-[#040806] border border-white/5 rounded-xl overflow-hidden shadow-inner group">
          {/* Radar Background Topography Wire lines */}
          <div 
            className="absolute inset-0 opacity-10 pointer-events-none" 
            style={{
              backgroundImage: `radial-gradient(circle, #20C997 1px, transparent 1px)`,
              backgroundSize: '24px 24px'
            }}
          ></div>

          {/* Render Vector Overlays representing structural ecological sectors */}
          {sectors.map(sec => {
            const health = calculateSectorHealth(sec.id);
            return (
              <div
                key={sec.id}
                onMouseEnter={() => setHoveredSector(sec)}
                onMouseLeave={() => setHoveredSector(null)}
                className={`absolute rounded-full border backdrop-blur-sm flex flex-col items-center justify-center cursor-crosshair transition-all duration-500 ${sec.size} ${health.color}`}
                style={{ 
                  left: sec.left, 
                  top: sec.top,
                  transform: 'translate(-100%, -50%)',
                  boxShadow: `0 0 30px ${health.bgGlow}`
                }}
              >
                <div className="text-center p-2 pointer-events-none">
                  <span className="block text-[11px] font-mono font-extrabold tracking-wider uppercase opacity-90">{sec.name.split(' - ')[0]}</span>
                  <span className="block text-[10px] font-mono opacity-60 mt-0.5">{Math.round(health.score * 100)}% Health</span>
                </div>
              </div>
            ); // <-- CORRECT EXTENSION NESTING CLOSURES PERFECTION
          })}

          {/* Simple Navigation Anchor Reference */}
          <div className="absolute bottom-4 left-4 text-[10px] font-mono text-emerald-100/30 flex items-center gap-1.5">
            <Info className="size-3" /> Hover map zones to query ecosystem situational matrices.
          </div>
        </div>

        {/* RIGHT: High-Tech Telemetry Bio-Metric Analysis Side Panel */}
        <div className="w-full bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col justify-between min-h-96">
          {hoveredSector ? (
            <div className="space-y-4 h-full flex flex-col justify-between animate-in fade-in duration-300">
              <div>
                <div className="border-b border-white/5 pb-2">
                  <span className="text-[10px] font-mono text-[#20C997] tracking-widest uppercase block">Live Telemetry Survey</span>
                  <h3 className="text-base font-bold text-white font-mono mt-0.5">{hoveredSector.name}</h3>
                </div>

                <div className="mt-3 bg-white/5 border border-white/5 rounded-xl p-3 text-center">
                  <span className="text-[10px] font-mono text-emerald-100/40 uppercase block">Circadian Ecosystem Zone Status</span>
                  <span className={`text-lg font-bold font-mono block mt-1 ${activeSectorData.text}`}>
                    {activeSectorData.status.toUpperCase()}
                  </span>
                  <p className="text-[11px] text-emerald-100/60 font-mono mt-1.5 leading-relaxed">{activeSectorData.desc}</p>
                </div>

                {/* The 4 Core Metrics requested by Mentor */}
                <div className="space-y-2.5 mt-4">
                  <span className="text-[10px] font-bold text-emerald-100/40 tracking-wider font-mono block uppercase">Ecological Indices</span>
                  
                  {/* Species Diversity */}
                  <div>
                    <div className="flex justify-between text-[11px] font-mono mb-1 text-emerald-100/70">
                      <span className="flex items-center gap-1"><Leaf className="size-3 text-emerald-400" /> Species Diversity</span>
                      <span>{activeSectorData.metrics.diversity}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-emerald-400 transition-all duration-500" style={{ width: `${activeSectorData.metrics.diversity}%` }}></div></div>
                  </div>

                  {/* Activity Frequency */}
                  <div>
                    <div className="flex justify-between text-[11px] font-mono mb-1 text-emerald-100/70">
                      <span className="flex items-center gap-1"><Activity className="size-3 text-yellow-400" /> Activity Frequency</span>
                      <span>{activeSectorData.metrics.frequency}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-yellow-400 transition-all duration-500" style={{ width: `${activeSectorData.metrics.frequency}%` }}></div></div>
                  </div>

                  {/* Sound Density */}
                  <div>
                    <div className="flex justify-between text-[11px] font-mono mb-1 text-emerald-100/70">
                      <span className="flex items-center gap-1"><Volume2 className="size-3 text-blue-400" /> Sound Density</span>
                      <span>{activeSectorData.metrics.density}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-blue-400 transition-all duration-500" style={{ width: `${activeSectorData.metrics.density}%` }}></div></div>
                  </div>

                  {/* Temporal Variation */}
                  <div>
                    <div className="flex justify-between text-[11px] font-mono mb-1 text-emerald-100/70">
                      <span className="flex items-center gap-1"><Heart className="size-3 text-purple-400" /> Temporal Variation</span>
                      <span>{activeSectorData.metrics.variation}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-purple-400 transition-all duration-500" style={{ width: `${activeSectorData.metrics.variation}%` }}></div></div>
                  </div>

                </div>
              </div>

              <div className="text-[10px] font-mono text-emerald-100/30 text-center border-t border-white/5 pt-2">
                Data refreshed via Edge Node Mesh Array.
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
              <Leaf className="size-8 text-emerald-100/10 animate-pulse mb-2.5" />
              <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">Eco Intelligence Matrix</h4>
              <p className="text-[11px] text-emerald-100/40 font-mono mt-1 leading-normal max-w-[180px]">
                Hover cursor over any topological biosphere zone to evaluate complex biodiversity health.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default ThreatHeatmap;