import React, { useState } from 'react';
import { AlertTriangle, Clock, Crosshair, CheckCircle2, ShieldAlert } from 'lucide-react';
import PatrolCommand from './PatrolCommand';

const AlertSystem = ({ logs = [] }) => {
  // Filter the logs to find ONLY the ones where the AI triggered an alert
  const activeAlerts = logs.filter(log => log && log.alert === true);

  // Dynamic state to track which alert IDs (or indexes) have had rangers dispatched
  const [dispatchedAlerts, setDispatchedAlerts] = useState({});

  const handleDispatch = (index, alertType) => {
    // Toggle or lock the status for this specific alert item
    setDispatchedAlerts(prev => ({
      ...prev,
      [index]: true
    }));
    
    // Log to browser developer console instead of triggering a PDF print
    console.log(`🚨 Dispatch Protocol Initiated for: ${alertType} at Sector 4`);
  };

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl p-6 mt-6 max-w-5xl mx-auto">
      <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
        <AlertTriangle className="text-red-500 size-5" /> Threat Dispatch Center
      </h2>

      {/* --- NEW PREDICTIVE ROUTING CARD --- */}
      <PatrolCommand />

      <div className="space-y-4">
        {activeAlerts.length === 0 ? (
          <div className="p-10 text-center border border-white/10 bg-white/5 rounded-xl flex flex-col items-center justify-center">
            <CheckCircle2 className="size-12 text-[#20C997] mb-3" />
            <h3 className="text-lg font-medium text-white">All Clear</h3>
            <p className="text-sm text-emerald-100/50 mt-1">No anomalous threats detected across the active sensor grid.</p>
          </div>
        ) : (
          activeAlerts.map((alert, index) => {
            const isDispatched = dispatchedAlerts[index];

            return (
              <div 
                key={index} 
                className={`p-4 border rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all duration-300 ${
                  isDispatched 
                    ? 'bg-emerald-500/10 border-emerald-500/30' 
                    : 'bg-red-500/10 border-red-500/30 shadow-lg shadow-red-500/5'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full transition-colors duration-300 ${
                    isDispatched 
                      ? 'bg-emerald-500/20 text-[#20C997]' 
                      : 'bg-red-500/20 text-red-400 animate-pulse'
                  }`}>
                    {isDispatched ? <ShieldAlert className="size-6" /> : <AlertTriangle className="size-6" />}
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold transition-colors ${isDispatched ? 'text-emerald-400' : 'text-red-400'}`}>
                      {alert.prediction.toUpperCase()} DETECTED {isDispatched && '(PATROL EN ROUTE)'}
                    </h3>
                    <div className="flex gap-4 text-xs text-emerald-100/60 mt-1">
                      <span className="flex items-center gap-1"><Crosshair className="size-3" /> Sector 4 - New Town Edge</span>
                      <span className="flex items-center gap-1"><Clock className="size-3" /> {alert.timestamp || 'Just Now'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                  <div className="text-center min-w-[70px]">
                    <span className="block text-xs text-emerald-100/50">Confidence</span>
                    <span className="font-mono text-white">
                      {alert.confidence ? Math.round(alert.confidence * 100) : '98'}%
                    </span>
                  </div>
                  
                  {isDispatched ? (
                    <button 
                      disabled
                      className="bg-emerald-500/20 text-[#20C997] border border-[#20C997]/40 px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed transition-all"
                    >
                      Rangers En Route
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleDispatch(index, alert.prediction)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-red-500/20 cursor-pointer active:scale-95 transform duration-150"
                    >
                      Dispatch Rangers
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AlertSystem;