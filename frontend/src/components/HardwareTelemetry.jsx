import React, { useState, useEffect } from 'react';
import { Cpu, BatteryCharging, Wifi, Mic2, Activity, Server, Zap } from 'lucide-react';

const HardwareTelemetry = () => {
  // State for live-fluctuating telemetry data
  const [cpuTemp, setCpuTemp] = useState(42.1);
  const [solarVoltage, setSolarVoltage] = useState(4.24);
  const [ping, setPing] = useState(24);

  // Simulate live hardware fluctuations every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCpuTemp(41 + Math.random() * 4); // Fluctuates between 41C and 45C
      setSolarVoltage(4.1 + Math.random() * 0.2); // Fluctuates between 4.10V and 4.30V
      setPing(20 + Math.floor(Math.random() * 12)); // Fluctuates between 20ms and 32ms
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#0a120e]/80 backdrop-blur-xl border border-[#20C997]/30 shadow-[0_0_30px_rgba(32,201,151,0.05)] rounded-2xl p-5 relative overflow-hidden group">
      
      {/* Background glowing sweep effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#20C997]/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

      <div className="flex justify-between items-center mb-5 border-b border-white/5 pb-3">
        <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
          <Server className="text-[#20C997] size-4" /> Edge Node Alpha
        </h2>
        <div className="flex items-center gap-1.5">
          <div className="size-2 rounded-full bg-[#20C997] animate-pulse shadow-[0_0_8px_rgba(32,201,151,0.8)]"></div>
          <span className="text-xs font-mono text-[#20C997]">ONLINE</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        
        {/* CPU Temp */}
        <div className="bg-black/40 border border-white/5 rounded-xl p-3 hover:border-red-500/30 transition-colors">
          <div className="flex items-center justify-between mb-1">
            <Cpu className="size-4 text-emerald-100/50" />
            <Activity className={`size-3 ${cpuTemp > 44 ? 'text-red-400' : 'text-[#20C997]'}`} />
          </div>
          <p className="text-xs text-emerald-100/50 mb-0.5">YAMNet Core Temp</p>
          <p className="text-lg font-mono text-white">
            {cpuTemp.toFixed(1)}<span className="text-xs text-emerald-100/30">°C</span>
          </p>
        </div>

        {/* Power / Solar */}
        <div className="bg-black/40 border border-white/5 rounded-xl p-3 hover:border-yellow-500/30 transition-colors">
          <div className="flex items-center justify-between mb-1">
            <Zap className="size-4 text-yellow-400" />
            <BatteryCharging className="size-4 text-[#20C997]" />
          </div>
          <p className="text-xs text-emerald-100/50 mb-0.5">Solar PV Input</p>
          <p className="text-lg font-mono text-white">
            {solarVoltage.toFixed(2)}<span className="text-xs text-emerald-100/30">V</span>
          </p>
        </div>

        {/* Network Ping */}
        <div className="bg-black/40 border border-white/5 rounded-xl p-3 hover:border-blue-500/30 transition-colors">
          <div className="flex items-center justify-between mb-1">
            <Wifi className="size-4 text-blue-400" />
            <span className="text-[10px] font-mono text-blue-400/50">MESH</span>
          </div>
          <p className="text-xs text-emerald-100/50 mb-0.5">Cloud Uplink</p>
          <p className="text-lg font-mono text-white">
            {ping}<span className="text-xs text-emerald-100/30">ms</span>
          </p>
        </div>

        {/* Mic Array */}
        <div className="bg-black/40 border border-white/5 rounded-xl p-3 hover:border-[#20C997]/30 transition-colors">
          <div className="flex items-center justify-between mb-1">
            <Mic2 className="size-4 text-[#20C997]" />
            <span className="flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-[#20C997] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#20C997]"></span>
            </span>
          </div>
          <p className="text-xs text-emerald-100/50 mb-0.5">Mic Impedance</p>
          <p className="text-sm font-mono text-[#20C997] mt-1">NOMINAL</p>
        </div>

      </div>
    </div>
  );
};

export default HardwareTelemetry;