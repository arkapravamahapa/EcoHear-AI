import React from 'react';
import { Crosshair, MapPin, AlertCircle } from 'lucide-react';

const TacticalMap = ({ activeAlerts = [], showRoute = false }) => {
  // 1. DYNAMIC HOTSPOTS: Convert live database alerts into map coordinates
  const hotspots = activeAlerts.map((alert, index) => {
    // Array of distributed grid coordinates for the demo to spread them out
    const xPositions = [30, 75, 45, 80, 20, 60, 40];
    const yPositions = [70, 35, 25, 50, 40, 80, 20];
    
    const type = alert.prediction ? alert.prediction.toLowerCase() : '';
    
    // Assign tactical colors based on the actual AI prediction
    let color = 'text-red-500';
    let glow = 'bg-red-500';
    if (type.includes('chainsaw') || type.includes('logging')) {
      color = 'text-orange-500'; glow = 'bg-orange-500';
    } else if (type.includes('vehicle') || type.includes('engine')) {
      color = 'text-yellow-500'; glow = 'bg-yellow-500';
    }

    return {
      id: alert.id || `temp-${index}`,
      type: alert.prediction || 'Unknown Threat',
      x: xPositions[index % xPositions.length],
      y: yPositions[index % yPositions.length],
      color,
      glow
    };
  });

  // 2. DYNAMIC PATHING: Calculate the line connecting HQ to all active threats
  let interceptionPath = "10,90"; // Always start at Ranger HQ
  if (showRoute && hotspots.length > 0) {
    hotspots.forEach(spot => {
      interceptionPath += ` ${spot.x},${spot.y}`;
    });
  }

  return (
    <div className="relative w-full h-64 md:h-80 bg-[#050a08] border border-[#20C997]/20 rounded-xl overflow-hidden mt-6 shadow-inner group">
      
      {/* Background Radar Grid */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none" 
        style={{
          backgroundImage: `linear-gradient(#20C997 1px, transparent 1px), linear-gradient(90deg, #20C997 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}
      ></div>

      {/* SVG Overlay for Paths and Radius Circles */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        
        {/* Threat Radius Circles */}
        {hotspots.map(spot => (
          <circle 
            key={`radius-${spot.id}`} 
            cx={spot.x} 
            cy={spot.y} 
            r="12" 
            fill="currentColor" 
            className={`${spot.color} opacity-10 animate-pulse`} 
          />
        ))}

        {/* Tactical Patrol Route Line (Only draws if showRoute is true) */}
        {showRoute && hotspots.length > 0 && (
          <polyline
            points={interceptionPath}
            fill="none"
            stroke="#20C997"
            strokeWidth="1.5"
            strokeDasharray="3 3"
            className="animate-[dash_1s_linear_infinite]"
          />
        )}
        
        {/* Route Waypoint Nodes */}
        {showRoute && interceptionPath.split(' ').map((point, idx) => {
          const [px, py] = point.split(',');
          return (
            <circle key={`node-${idx}`} cx={px} cy={py} r="1.5" fill="#20C997" className="animate-pulse" />
          );
        })}
      </svg>

      {/* HTML Overlay for Icons & Tooltips */}
      <div className="absolute inset-0">
        
        {/* Start Point (Ranger HQ) */}
        <div className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2" style={{ left: '10%', top: '90%' }}>
          <MapPin className="size-5 text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
          <span className="text-[9px] font-mono text-blue-400 mt-1 font-bold bg-black/50 px-1 rounded">Ranger HQ</span>
        </div>

        {/* Threat Hotspots Generated from Live Database Data */}
        {hotspots.map(spot => (
          <div 
            key={`marker-${spot.id}`}
            className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2 cursor-crosshair"
            style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
          >
            {/* Pulsing Core */}
            <div className="relative flex items-center justify-center">
              <span className={`absolute inline-flex h-full w-full rounded-full ${spot.glow} opacity-40 animate-ping`}></span>
              <AlertCircle className={`relative size-5 ${spot.color} drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] bg-black/50 rounded-full`} />
            </div>
            {/* Label */}
            <span className={`text-[9px] font-mono ${spot.color} mt-1 font-bold bg-black/60 px-1.5 py-0.5 rounded border border-${spot.color}/30 backdrop-blur-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity`}>
              {spot.type.toUpperCase()}
            </span>
          </div>
        ))}
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md border border-white/10 p-2 rounded-lg text-[10px] font-mono text-emerald-100/70 space-y-1.5 pointer-events-none">
        <div className="flex items-center gap-2"><span className="w-3 border-t border-dashed border-[#20C997]"></span> AI Patrol Route</div>
        <div className="flex items-center gap-2"><div className="size-2 rounded-full bg-red-500 animate-pulse"></div> Active Threat</div>
        <div className="flex items-center gap-2"><div className="size-2 rounded-full bg-blue-400"></div> Dispatch Origin</div>
      </div>
    </div>
  );
};

export default TacticalMap;