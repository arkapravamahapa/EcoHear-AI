import React, { useState } from 'react';
import { Route, MapPin, Loader2, Sparkles, AlertTriangle, ChevronRight } from 'lucide-react';
import { generatePatrolRoute } from '../services/api';

const PatrolCommand = () => {
  const [routePlan, setRoutePlan] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateRoute = async () => {
    setIsGenerating(true);
    try {
      const data = await generatePatrolRoute();
      setRoutePlan(data.route);
    } catch (error) {
      setRoutePlan("⚠️ Error establishing link to Tactical Command.");
    } finally {
      setIsGenerating(false);
    }
  };

  // This function intercepts Gemini's raw text and converts it into a stunning UI
  const renderTacticalUI = (text) => {
    if (!text) return null;

    // Fallback cleanup if the AI changes its format slightly
    const cleanText = text.replace(/\*\*/g, '');

    // Try to split the text into Pattern and Steps
    const patternSplit = text.split(/3-Step Patrol Route:|3-Step/i);
    const rawPattern = patternSplit[0]?.replace(/Pattern:/i, '').replace(/\*\*/g, '').trim();
    const rawSteps = patternSplit[1] || '';
    
    // Extract individual steps
    const stepItems = rawSteps.split(/\* Step \d+:|\* \*\*Step \d+:\*\*|\d+\./i)
      .filter(s => s.trim() !== '')
      .map(s => s.replace(/\*\*/g, '').trim());

    // If parsing fails, return a clean text block
    if (stepItems.length === 0) {
      return <div className="text-emerald-50/90 whitespace-pre-line text-sm p-2">{cleanText}</div>;
    }

    return (
      <div className="space-y-6 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* The Pattern Warning Box */}
        {rawPattern && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start gap-4 shadow-inner">
            <div className="bg-red-500/20 p-2 rounded-lg shrink-0 mt-0.5">
              <AlertTriangle className="size-5 text-red-400" />
            </div>
            <div>
              <h4 className="text-red-400 text-xs font-bold uppercase tracking-[0.2em] mb-1.5">Detected Pattern</h4>
              <p className="text-red-100/90 text-sm leading-relaxed">{rawPattern}</p>
            </div>
          </div>
        )}

        {/* The Vertical Timeline */}
        <div>
          <h4 className="text-[#20C997] text-xs font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <Route className="size-4" /> Tactical Action Plan
          </h4>
          
          <div className="space-y-0 relative">
            {stepItems.map((step, idx) => (
              <div key={idx} className="flex gap-4 group relative z-10">
                
                {/* Timeline Line & Node */}
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-[#0a120e] border-2 border-[#20C997]/40 group-hover:border-[#20C997] flex items-center justify-center text-[#20C997] text-xs font-bold transition-all shadow-[0_0_10px_rgba(32,201,151,0)] group-hover:shadow-[0_0_15px_rgba(32,201,151,0.4)] z-10">
                    0{idx + 1}
                  </div>
                  {/* Draw the connecting line unless it's the last item */}
                  {idx !== stepItems.length - 1 && (
                    <div className="w-[2px] h-full min-h-[30px] bg-gradient-to-b from-[#20C997]/40 to-[#20C997]/10 my-1 group-hover:from-[#20C997] transition-all"></div>
                  )}
                </div>

                {/* Step Content Card */}
                <div className="bg-white/5 border border-white/5 p-4 rounded-xl flex-1 text-sm text-emerald-100/80 group-hover:bg-white/10 group-hover:text-white transition-colors mb-4 flex items-start gap-3">
                  <ChevronRight className="size-4 text-[#20C997]/50 mt-0.5 shrink-0" />
                  <span className="leading-relaxed">{step}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#0a120e]/80 backdrop-blur-xl border border-[#20C997]/30 shadow-[0_0_40px_rgba(32,201,151,0.05)] rounded-2xl p-6 md:p-8 mb-8 relative overflow-hidden group transition-all duration-500 hover:shadow-[0_0_50px_rgba(32,201,151,0.1)]">
      
      {/* Background glowing sweep effect */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#20C997]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none group-hover:bg-[#20C997]/10 transition-colors duration-700"></div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2 relative z-10">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Route className="text-[#20C997] size-7" /> AI Patrol Routing
          </h2>
          <p className="text-sm text-emerald-100/50 mt-1.5 font-medium">
            Synthesize historical acoustic telemetry to predict optimal interception paths.
          </p>
        </div>
        
        <button 
          onClick={handleGenerateRoute}
          disabled={isGenerating}
          className="bg-[#20C997] hover:bg-[#1bb386] text-[#0a120e] px-6 py-3 rounded-xl text-sm font-extrabold transition-all shadow-[0_0_20px_rgba(32,201,151,0.2)] hover:shadow-[0_0_30px_rgba(32,201,151,0.4)] disabled:opacity-50 flex items-center gap-2 active:scale-95 border border-[#20C997]"
        >
          {isGenerating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {isGenerating ? 'Calculating Matrix...' : 'Generate Route'}
        </button>
      </div>

      {/* Output Display Area */}
      {routePlan && (
        <div className="mt-8 relative z-10 border-t border-white/10 pt-6">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="text-[#20C997] size-4 animate-pulse" />
            <span className="text-xs font-mono text-emerald-100/50 tracking-widest uppercase">Tactical Command Link Established</span>
          </div>
          
          {/* Render our beautifully formatted UI instead of raw text */}
          {renderTacticalUI(routePlan)}
          
        </div>
      )}
    </div>
  );
};

export default PatrolCommand;