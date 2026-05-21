import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, Activity, History, ShieldCheck, User } from 'lucide-react';

// Import all components
import AudioUploader from '../components/AudioUploader';
import PredictionCard from '../components/PredictionCard';
import HistoryTable from '../components/HistoryTable';
import ThreatHeatmap from '../components/ThreatHeatmap';
import BiodiversityScore from '../components/BiodiversityScore';
import EcoBot from '../components/EcoBot';
import AlertSystem from '../components/AlertSystem';
import UserProfile from '../components/UserProfile';

// NEW: Import the API call to fetch history on load
import { getDetectionHistory } from '../services/api';

const Dashboard = () => {
  // Navigation State
  const [activeTab, setActiveTab] = useState('overview');
  
  // Dashboard Core State
  const [latestResult, setLatestResult] = useState(null);
  
  // Start with an empty array instead of dummy data
  const [history, setHistory] = useState([]);

  // NEW: Fetch live database history when the app loads
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const dbHistory = await getDetectionHistory();
        setHistory(dbHistory);
      } catch (error) {
        console.error("Failed to load initial history:", error);
      }
    };
    loadHistory();
  }, []);

  const handleNewPrediction = (result) => {
    setLatestResult(result);
    // Add the new result to the top of the history list dynamically
    setHistory(prev => [result, ...prev]);
  };

  // Switch statement to render the correct view
  const renderContent = () => {
    switch(activeTab) {
      // NEW: Pass the live history data into the Heatmap and Biodiversity components
      case 'heatmap': return <ThreatHeatmap logs={history} />;
      case 'biodiversity': return <BiodiversityScore logs={history} />;
      case 'chat': return <EcoBot />;
      // NEW: Pass the live history data into the Alert System
      case 'alerts': return <AlertSystem logs={history} />;
      case 'profile': return <UserProfile />;
      default: 
        return (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-4 md:py-6">
              <h1 className="text-5xl md:text-6xl font-['Instrument_Serif',serif] text-white mb-3 tracking-tight leading-none">
                The Future of <span className="italic">Smarter</span> Conservation
              </h1>
              <p className="text-emerald-100/60 text-sm md:text-base max-w-xl mx-auto">
                Continuous autonomous eco-acoustic sensing built to protect tracking data pathways and detect resource threats.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 flex flex-col gap-6">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl p-6 flex-1 flex flex-col min-h-70">
                  <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                    <Mic className="text-[#20C997] size-4" /> Analyze Audio File
                  </h2>
                  <AudioUploader onPredictionComplete={handleNewPrediction} />
                </motion.div>

                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl p-6 h-50">
                  <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                    <Activity className="text-[#20C997] size-4" /> Live Execution Result
                  </h2>
                  <PredictionCard result={latestResult} />
                </motion.div>
              </div>

              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2 bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl p-6 flex flex-col min-h-125">
                <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                  <History className="text-[#20C997] size-4" /> Real-Time Tracking Registry
                </h2>
                <div className="flex-1 relative overflow-hidden">
                   <HistoryTable logs={history} />
                </div>
              </motion.div>
            </div>
          </>
        );
    }
  };

  // Nav Items Data
  const navItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'heatmap', label: 'Threat Heatmap' },
    { id: 'biodiversity', label: 'Biodiversity' },
    { id: 'alerts', label: 'Alerts' },
    { id: 'chat', label: 'EcoBot Chat' },
  ];

  return (
    <div className="relative min-h-screen w-full text-gray-100">
      <video autoPlay loop muted playsInline className="fixed inset-0 w-full h-full object-cover -z-20" src="/forest-bg.mp4" />
      <div className="fixed inset-0 bg-[#040a06]/40 -z-10"></div>

      <div className="relative z-10 px-4 md:px-8 py-6 max-w-7xl mx-auto space-y-8">
        
        {/* Navbar */}
        <header className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl px-6 py-4 rounded-2xl">
          <div 
            className="flex items-center gap-3 cursor-pointer" 
            onClick={() => setActiveTab('overview')}
          >
            <ShieldCheck className="size-8 text-[#20C997]" />
            <span className="text-2xl font-bold tracking-tight text-white font-['Instrument_Serif',serif]">
              EcoHear<span className="text-[#20C997] italic">.AI</span>
            </span>
          </div>
          
          {/* Dynamic Navigation Links */}
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-6">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`text-sm font-medium transition-colors ${activeTab === item.id ? 'text-[#20C997] border-b-2 border-[#20C997] pb-1' : 'text-emerald-100/60 hover:text-white'}`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div 
            className="flex items-center gap-2 text-sm font-medium text-[#20C997] bg-white/5 px-4 py-2 rounded-full border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
            onClick={() => setActiveTab('profile')}
          >
            <User className="size-4" /> Profile
          </div>
        </header>

        {/* Dynamic Content Rendering */}
        <div className="pt-2">
          {renderContent()}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;