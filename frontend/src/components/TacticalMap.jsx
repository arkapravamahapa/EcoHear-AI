import React, { useState } from 'react';
import { Radio, Battery, Cpu, ShieldAlert, Signal, Volume2, X, Activity, MapPin, Layers } from 'lucide-react';

const TacticalMap = ({ activeAlerts = [], showRoute = false }) => {
  // 1. Define fixed static physical sensor nodes deployed in the forest grid
  const sensorNodes = [
    { 
      id: 'Alpha', 
      name: 'Node Alpha (North Ridge)', 
      x: 35, 
      y: 30, 
      region: 'Deep Canopy Sector',
      baseBattery: 94,
      baseTemp: 40.5,
      signal: 'Excellent',
      triggerKeywords: ['chainsaw', 'logging', 'saw']
    },
    { 
      id: 'Bravo', 
      name: 'Node Bravo (New Town Perimeter)', 
      x: 70, 
      y: 50, 
      region: 'Access Road Buffer',
      baseBattery: 81,
      baseTemp: 44.2,
      signal: 'Strong',
      triggerKeywords: ['gunshot', 'gun', 'shots']
    },
    { 
      id: 'Charlie', 
      name: 'Node Charlie (South Boundary)', 
      x: 45, 
      y: 75, 
      region: 'Swamp Clear Cut Boundary',
      baseBattery: 88,
      baseTemp: 39.1,
      signal: 'Moderate',
      triggerKeywords: ['vehicle', 'engine', 'truck']
    }
  ];

  // State to track which specific sensor node is currently being inspected
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  // 2. DYNAMIC CROSS-REFERENCING: Filter live database alerts onto their corresponding nodes
  const getAlertsForNode = (node) => {
    return activeAlerts.filter(alert => {
      const pred = alert.prediction ? alert.prediction.toLowerCase() : '';
      return node.triggerKeywords.some(keyword => pred.includes(keyword));
    });
  };

  // Find the currently selected node data structure
  const selectedNode = sensorNodes.find(n => n.id === selectedNodeId);
  const selectedNodeAlerts = selectedNode ? getAlertsForNode(selectedNode) : [];

  // Calculate geometric interception lines from HQ to active threat nodes
  let interceptionPath = "10,90"; 
  if (showRoute) {
    sensorNodes.forEach(node => {
      if (getAlertsForNode(node).length > 0) {
        interceptionPath += ` ${node.x},${node.y}`;
      }
    });
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 mt-6 animate-in fade-in duration-300">
      
      {/* LEFT: The Interactive Grid Display Container */}
      <div className="relative flex-1 h-80 bg-[#050a08] border border-[#20C997]/20 rounded-xl overflow-hidden shadow-inner group">
        {/* Background Radar Grid Overlay */}
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none" 
          style={{
            backgroundImage: `linear-gradient(#20C997 1px, transparent 1px), linear-gradient(90deg, #20C997 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
          }}
        ></div>

        {/* SVG Path Layer */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Render threat radius blast halos if a sensor node has active alerts */}
          {sensorNodes.map(node => {
            const nodeAlerts = getAlertsForNode(node);
            if (nodeAlerts.length === 0) return null;
            return (
              <circle 
                key={`halo-${node.id}`} 
                cx={node.x} 
                cy={node.y} 
                r="14" 
                fill="currentColor" 
                className="text-red-500 opacity-10 animate-pulse" 
              />
            );
          })}

          {/* Glowing Vector Navigation Interception Route Line */}
          {showRoute && interceptionPath !== "10,90" && (
            <polyline
              points={interceptionPath}
              fill="none"
              stroke="#20C997"
              strokeWidth="1.2"
              strokeDasharray="3 3"
              className="animate-[dash_1s_linear_infinite]"
            />
          )}
        </svg>

        {/* HTML Rendered Markers Overlay */}
        <div className="absolute inset-0">
          {/* Base Camp Location Icon */}
          <div className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2" style={{ left: '10%', top: '90%' }}>
            <MapPin className="size-5 text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)] bg-black/50 rounded-full p-0.5" />
            <span className="text-[9px] font-mono text-blue-400 mt-1 font-bold bg-black/70 px-1 rounded">HQ Base</span>
          </div>

          {/* Live Interactive Deployed Sensor Array Nodes */}
          {sensorNodes.map(node => {
            const nodeAlerts = getAlertsForNode(node);
            const isTriggered = nodeAlerts.length > 0;
            const isCurrent = selectedNodeId === node.id;

            return (
              <button 
                key={node.id}
                onClick={() => setSelectedNodeId(node.id)}
                className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2 transition-transform active:scale-90 z-20 focus:outline-none"
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
              >
                <div className={`relative flex items-center justify-center p-2 rounded-full border transition-all duration-300 ${
                  isTriggered 
                    ? 'bg-red-950/80 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
                    : isCurrent
                      ? 'bg-emerald-950/80 border-[#20C997] shadow-[0_0_15px_rgba(32,201,151,0.4)]'
                      : 'bg-[#0a120e]/90 border-emerald-500/30 hover:border-[#20C997]'
                }`}>
                  {isTriggered && (
                    <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-40 animate-ping"></span>
                  )}
                  <Radio className={`size-4 ${isTriggered ? 'text-red-400 animate-bounce' : isCurrent ? 'text-[#20C997]' : 'text-emerald-100/60'}`} />
                </div>
                {/* Identity Tag labels */}
                <span className={`text-[9px] font-mono mt-1 font-bold px-1.5 py-0.5 rounded border backdrop-blur-md transition-colors ${
                  isTriggered
                    ? 'bg-red-950/70 text-red-400 border-red-500/20'
                    : isCurrent
                      ? 'bg-emerald-950/70 text-[#20C997] border-[#20C997]/30'
                      : 'bg-black/60 text-emerald-100/50 border-white/5'
                }`}>
                  {node.id}
                </span>
              </button>
            );
          })}
        </div>

        {/* Map Information Sub-Legend Overlay */}
        <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md border border-white/10 p-2 rounded-lg text-[9px] font-mono text-emerald-100/70 space-y-1 pointer-events-none">
          <div className="flex items-center gap-1.5"><Radio className="size-3 text-[#20C997]" /> Nominal Edge Node</div>
          <div className="flex items-center gap-1.5"><Radio className="size-3 text-red-400 animate-pulse" /> Threat Active Node</div>
        </div>
      </div>

      {/* RIGHT: High-Tech Telemetry Situation Inspection Panel */}
      <div className="w-full lg:w-72 bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col justify-between min-h-80 relative overflow-hidden">
        {selectedNode ? (
          <div className="space-y-4 h-full flex flex-col justify-between animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              {/* Header block details */}
              <div className="flex justify-between items-start border-b border-white/5 pb-2.5">
                <div>
                  <h3 className="text-sm font-bold text-white font-mono">{selectedNode.name}</h3>
                  <p className="text-[11px] text-emerald-100/50 font-mono mt-0.5">{selectedNode.region}</p>
                </div>
                <button 
                  onClick={() => setSelectedNodeId(null)}
                  className="text-emerald-100/40 hover:text-white p-0.5 rounded hover:bg-white/5 transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Live Situational Grid Telemetry readings */}
              <div className="grid grid-cols-2 gap-2.5 mt-3 text-xs font-mono">
                <div className="bg-white/5 border border-white/5 rounded-lg p-2 flex items-center gap-2">
                  <Battery className="size-4 text-[#20C997]" />
                  <div>
                    <span className="block text-[10px] text-emerald-100/40">BATTERY</span>
                    <span className="text-white font-bold">{selectedNode.baseBattery}%</span>
                  </div>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-lg p-2 flex items-center gap-2">
                  <Cpu className="size-4 text-emerald-400" />
                  <div>
                    <span className="block text-[10px] text-emerald-100/40">CPU TEMP</span>
                    <span className="text-white font-bold">{selectedNode.baseTemp.toFixed(1)}°C</span>
                  </div>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-lg p-2 flex items-center gap-2">
                  <Signal className="size-4 text-blue-400" />
                  <div>
                    <span className="block text-[10px] text-emerald-100/40">LINK RX</span>
                    <span className="text-white font-bold">{selectedNode.signal}</span>
                  </div>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-lg p-2 flex items-center gap-2">
                  <Activity className="size-4 text-yellow-400" />
                  <div>
                    <span className="block text-[10px] text-emerald-100/40">STREAM</span>
                    <span className="text-[#20C997] font-bold text-[11px]">ACTIVE</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Targeted local log history matrix list */}
            <div className="flex-1 mt-4 overflow-y-auto max-h-24 pr-1 space-y-1.5 border-t border-white/5 pt-3">
              <span className="text-[10px] font-bold text-emerald-100/40 tracking-wider font-mono block mb-1 uppercase">Local Node Log Matrix</span>
              {selectedNodeAlerts.length === 0 ? (
                <div className="text-[11px] font-mono text-emerald-100/30 italic py-1 flex items-center gap-1.5">
                  <Layers className="size-3 text-emerald-100/20" /> No local active alarms recorded.
                </div>
              ) : (
                selectedNodeAlerts.map((alert, index) => (
                  <div key={index} className="bg-red-500/5 border border-red-500/10 rounded-md p-1.5 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-red-400 font-bold tracking-tight flex items-center gap-1">
                      <ShieldAlert className="size-3 text-red-400 shrink-0" /> {alert.prediction.toUpperCase()}
                    </span>
                    <span className="text-white/60 text-[10px]">{Math.round((alert.confidence || 0.98) * 100)}%</span>
                  </div>
                ))
              )}
            </div>

            {/* Action control capability block */}
            <button className="w-full mt-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-mono py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors group">
              <Volume2 className="size-3.5 text-[#20C997] group-hover:scale-110 transition-transform" /> Intercept Audio Feed
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
            <Radio className="size-8 text-emerald-100/20 animate-pulse mb-2.5" />
            <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">Tactical System Monitor</h4>
            <p className="text-[11px] text-emerald-100/40 font-mono mt-1 leading-normal max-w-[180px]">
              Tap any deployed sensor node on the grid matrix to audit its current situation.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};

export default TacticalMap;