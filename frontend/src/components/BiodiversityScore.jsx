import React from 'react';
import { Activity, Bird, Trees } from 'lucide-react';

const BiodiversityScore = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
      <div className="col-span-1 md:col-span-3 bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-emerald-100/70 mb-2">Overall Ecosystem Health</h2>
          <div className="text-7xl font-display text-white">92<span className="text-2xl text-emerald-100/40 font-body">/100</span></div>
          <p className="text-[#20C997] font-medium mt-2">+5.2% Improvement since last month</p>
        </div>
        
        {/* Mock Chart Area */}
        <div className="h-32 w-full md:w-1/2 mt-6 md:mt-0 flex items-end gap-2 border-b border-white/10 pb-2">
          {[40, 55, 45, 60, 75, 65, 80, 92].map((height, i) => (
            <div key={i} className="flex-1 bg-[#20C997]/20 hover:bg-[#20C997] transition-all rounded-t-sm" style={{ height: `${height}%` }}></div>
          ))}
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
        <Bird className="size-8 text-[#20C997] mb-4" />
        <h3 className="text-2xl font-bold text-white">124</h3>
        <p className="text-emerald-100/70 text-sm">Unique Species Logged</p>
      </div>

      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
        <Activity className="size-8 text-[#20C997] mb-4" />
        <h3 className="text-2xl font-bold text-white">1,402</h3>
        <p className="text-emerald-100/70 text-sm">Acoustic Events Today</p>
      </div>

      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
        <Trees className="size-8 text-[#20C997] mb-4" />
        <h3 className="text-2xl font-bold text-white">99.8%</h3>
        <p className="text-emerald-100/70 text-sm">Forest Cover Intact</p>
      </div>
    </div>
  );
};

export default BiodiversityScore;