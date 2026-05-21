import React from 'react';
import { AlertTriangle, Clock, Crosshair } from 'lucide-react';

const AlertSystem = () => {
  const alerts = [
    { id: 'ALT-921', type: 'Chainsaw Detected', location: 'Sector 2 - North Ridge', time: '12:42 PM', conf: '99%', status: 'Active' },
    { id: 'ALT-920', type: 'Vehicle Engine', location: 'Sector 4 - Boundary', time: '08:15 AM', conf: '87%', status: 'Investigating' },
    { id: 'ALT-919', type: 'Gunshot Signature', location: 'Sector 1 - Deep Woods', time: 'Yesterday', conf: '94%', status: 'Resolved' },
  ];

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl p-6 mt-6 max-w-5xl mx-auto">
      <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
        <AlertTriangle className="text-red-500 size-5" /> Threat Dispatch Center
      </h2>

      <div className="space-y-4">
        {alerts.map((alert) => (
          <div key={alert.id} className={`p-4 border rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${alert.status === 'Active' ? 'bg-red-500/10 border-red-500/30' : 'bg-white/5 border-white/10'}`}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${alert.status === 'Active' ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-white/10 text-emerald-100/50'}`}>
                <AlertTriangle className="size-6" />
              </div>
              <div>
                <h3 className={`text-lg font-bold ${alert.status === 'Active' ? 'text-red-400' : 'text-white'}`}>{alert.type}</h3>
                <div className="flex gap-4 text-xs text-emerald-100/60 mt-1">
                  <span className="flex items-center gap-1"><Crosshair className="size-3" /> {alert.location}</span>
                  <span className="flex items-center gap-1"><Clock className="size-3" /> {alert.time}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
              <div className="text-center">
                <span className="block text-xs text-emerald-100/50">Confidence</span>
                <span className="font-mono text-white">{alert.conf}</span>
              </div>
              {alert.status === 'Active' ? (
                <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-red-500/20">
                  Dispatch Rangers
                </button>
              ) : (
                <span className="px-4 py-2 text-sm text-emerald-100/40 font-medium">{alert.status}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlertSystem;