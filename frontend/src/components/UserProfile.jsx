import React from 'react';
import { User, Mail, Shield, MapPin, Settings, LogOut } from 'lucide-react';

const UserProfile = () => {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl p-8 max-w-2xl mx-auto mt-10">
      <div className="flex flex-col md:flex-row items-center gap-6 border-b border-white/10 pb-8">
        <div className="size-24 rounded-full bg-[#20C997]/20 border-2 border-[#20C997] flex items-center justify-center text-3xl font-display text-[#20C997]">
          SD
        </div>
        <div className="text-center md:text-left">
          <h2 className="text-3xl font-bold text-white font-['Instrument_Serif',serif]">Soumyadeep Das</h2>
          <p className="text-[#20C997] font-medium flex items-center justify-center md:justify-start gap-2 mt-1">
            <Shield className="size-4" /> Lead Admin / Developer
          </p>
        </div>
      </div>
      
      <div className="py-6 space-y-4">
        <div className="flex items-center gap-4 text-emerald-100/70">
          <Mail className="size-5 text-[#20C997]" />
          <span>admin@ecohear.ai</span>
        </div>
        <div className="flex items-center gap-4 text-emerald-100/70">
          <MapPin className="size-5 text-[#20C997]" />
          <span>UEM Kolkata Base Station</span>
        </div>
        <div className="flex items-center gap-4 text-emerald-100/70">
          <Settings className="size-5 text-[#20C997]" />
          <span>System Preference: Edge Processing Node</span>
        </div>
      </div>
      
      <button className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors">
        <LogOut className="size-4" /> Sign Out
      </button>
    </div>
  );
};

export default UserProfile;