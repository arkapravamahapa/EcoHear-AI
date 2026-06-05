import React, { useState } from 'react';
import { AlertTriangle, Clock, Crosshair, CheckCircle2, ShieldAlert, Activity } from 'lucide-react';
import PatrolCommand from './PatrolCommand';

const AlertSystem = ({ logs = [] }) => {
  const activeAlerts = logs.filter(log => log && log.alert === true);

  const [dispatchedAlerts, setDispatchedAlerts] = useState({});
  // NEW STATE: Track which spectrograms are open
  const [expandedSpectrograms, setExpandedSpectrograms] = useState({});

  const handleDispatch = (index, alertType) => {
    setDispatchedAlerts(prev => ({ ...prev, [index]: true }));
    console.log(`🚨 Dispatch Protocol Initiated for: ${alertType} at Sector 4`);
  };

  // NEW FUNCTION: Toggle the image open/closed
  const toggleSpectrogram = (index) => {
    setExpandedSpectrograms(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl p-6 mt-6 max-w-5xl mx-auto">
      <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
        <AlertTriangle className="text-red-500 size-5" /> Threat Dispatch Center
      </h2>

      <PatrolCommand activeAlerts={activeAlerts} />

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
            const isExpanded = expandedSpectrograms[index];
            
            // Construct the URL to fetch the image from your FastAPI backend
            // (Assuming your backend runs on port 8000)
            const filenameNoExt = alert.filename ? alert.filename.split('.')[0] : 'unknown';
            const spectrogramUrl = `https://ecohear-api-zyms.onrender.com/uploads/${filenameNoExt}_spec.png`;

            return (
              <div 
                key={index} 
                className={`border rounded-xl flex flex-col transition-all duration-300 overflow-hidden ${
                  isDispatched 
                    ? 'bg-emerald-500/10 border-emerald-500/30' 
                    : 'bg-red-500/10 border-red-500/30 shadow-lg shadow-red-500/5'
                }`}
              >
                {/* Main Alert Bar */}
                <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
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
                        <span className="flex items-center gap-1"><Crosshair className="size-3" /> Sector 4</span>
                        <span className="flex items-center gap-1"><Clock className="size-3" /> {alert.timestamp || 'Just Now'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                    
                    {/* NEW: Toggle Spectrogram Button */}
                    <button 
                      onClick={() => toggleSpectrogram(index)}
                      className="text-xs flex items-center gap-1 text-blue-400 hover:text-blue-300 border border-blue-400/30 bg-blue-400/10 px-3 py-2 rounded-lg transition-colors"
                    >
                      <Activity className="size-3" />
                      {isExpanded ? 'Hide Visual' : 'View Visual Proof'}
                    </button>

                    <div className="text-center min-w-[60px]">
                      <span className="font-mono text-white text-lg">
                        {alert.confidence ? Math.round(alert.confidence * 100) : '98'}%
                      </span>
                    </div>
                    
                    {isDispatched ? (
                      <button disabled className="bg-emerald-500/20 text-[#20C997] border border-[#20C997]/40 px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed transition-all">
                        En Route
                      </button>
                    ) : (
                      <button onClick={() => handleDispatch(index, alert.prediction)} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-red-500/20 cursor-pointer active:scale-95">
                        Dispatch
                      </button>
                    )}
                  </div>
                </div>

                {/* NEW: Expanding Spectrogram Tray */}
                {isExpanded && (
                  <div className="bg-black/60 border-t border-white/5 p-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-mono text-emerald-100/50 uppercase tracking-widest">Acoustic Signature (Mel-Spectrogram)</span>
                      <span className="text-xs font-mono text-emerald-100/30">Target: {alert.filename}</span>
                    </div>
                    <div className="w-full h-32 md:h-40 bg-[#050a08] rounded-lg border border-white/10 overflow-hidden relative flex items-center justify-center">
                      <img 
                        src={spectrogramUrl} 
                        alt="Audio Spectrogram" 
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = ''; e.target.alt = 'Generating visual signature... please refresh.'; }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AlertSystem;