import React from 'react';
import { AlertTriangle, Clock, Crosshair, CheckCircle2 } from 'lucide-react';

// NEW: Accept the live logs from the Dashboard component
const AlertSystem = ({ logs = [] }) => {
  // NEW: Automatically filter the logs to find ONLY the ones where the AI triggered an alert
  const activeAlerts = logs.filter(log => log.alert === true);

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl p-6 mt-6 max-w-5xl mx-auto">
      <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
        <AlertTriangle className="text-red-500 size-5" /> Threat Dispatch Center
      </h2>

      <div className="space-y-4">
        {activeAlerts.length === 0 ? (
          <div className="p-10 text-center border border-white/10 bg-white/5 rounded-xl flex flex-col items-center justify-center">
            <CheckCircle2 className="size-12 text-[#20C997] mb-3" />
            <h3 className="text-lg font-medium text-white">All Clear</h3>
            <p className="text-sm text-emerald-100/50 mt-1">No anomalous threats detected across the active sensor grid.</p>
          </div>
        ) : (
          activeAlerts.map((alert, index) => (
            <div key={index} className="p-4 border rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-red-500/10 border-red-500/30">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-red-500/20 text-red-400 animate-pulse">
                  <AlertTriangle className="size-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-400">{alert.prediction.toUpperCase()} DETECTED</h3>
                  <div className="flex gap-4 text-xs text-emerald-100/60 mt-1">
                    <span className="flex items-center gap-1"><Crosshair className="size-3" /> Sector 4 - New Town Edge</span>
                    <span className="flex items-center gap-1"><Clock className="size-3" /> {alert.timestamp}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                <div className="text-center">
                  <span className="block text-xs text-emerald-100/50">Confidence</span>
                  <span className="font-mono text-white">{Math.round(alert.confidence * 100)}%</span>
                </div>
                <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-red-500/20">
                  Dispatch Rangers
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AlertSystem;