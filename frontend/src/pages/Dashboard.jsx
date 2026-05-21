import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, Activity, History, ShieldCheck, User } from 'lucide-react';

// Import all components
import HardwareTelemetry from '../components/HardwareTelemetry';
import AudioUploader from '../components/AudioUploader';
import PredictionCard from '../components/PredictionCard';
import HistoryTable from '../components/HistoryTable';
import ThreatHeatmap from '../components/ThreatHeatmap';
import BiodiversityScore from '../components/BiodiversityScore';
import EcoBot from '../components/EcoBot';
import AlertSystem from '../components/AlertSystem';
import UserProfile from '../components/UserProfile';
import TacticalMap from '../components/TacticalMap';
import LiveStreamNode from '../components/LiveStreamNode';

// Import the API call to fetch history on load
import { getDetectionHistory } from '../services/api';

const Dashboard = () => {
  // Navigation State
  const [activeTab, setActiveTab] = useState('overview');
  
  // Dashboard Core State
  const [latestResult, setLatestResult] = useState(null);
  
  // Start with an empty array instead of dummy data
  const [history, setHistory] = useState([]);

  // Fetch live database history when the app loads
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

  // Stream predictions straight into global application state
  const handleLiveStreamCaptured = (result) => {
    setLatestResult(result);
    setHistory(prev => [result, ...prev]);
  };

  // Nav Items Data
  const navItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'network', label: 'Sensor Network' },
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

        {/* Dynamic Content Rendering - Using CSS hidden/block to preserve state! */}
        <div className="pt-2">
          
          {/* Overview Tab */}
          <div className={activeTab === 'overview' ? 'block' : 'hidden'}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-4 md:py-6">
              <h1 className="text-5xl md:text-6xl font-['Instrument_Serif',serif] text-white mb-3 tracking-tight leading-none">
                The Future of <span className="italic">Smarter</span> Conservation
              </h1>
              <p className="text-emerald-100/60 text-sm md:text-base max-w-xl mx-auto">
                Continuous autonomous eco-acoustic sensing built to protect tracking data pathways and detect resource threats.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* LEFT COLUMN: Clean layout block handling vertical contents */}
              <div className="lg:col-span-1 flex flex-col gap-4">
                
                {/* 1. Live Microphone Stream Module */}
                <LiveStreamNode onStreamEventCaptured={handleLiveStreamCaptured} />

                {/* 2. File Upload Module (Fixed height constraint so it can never be crushed) */}
                <motion.div 
                  initial={{ opacity: 0, x: -20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: 0.1 }} 
                  className="bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl p-6 flex flex-col h-72"
                >
                  <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                    <Mic className="text-[#20C997] size-4" /> Analyze Audio File
                  </h2>
                  <div className="flex-1 overflow-y-auto">
                    <AudioUploader onPredictionComplete={handleNewPrediction} />
                  </div>
                </motion.div>

                {/* 3. Live Execution Result Node Card */}
                <motion.div 
                  initial={{ opacity: 0, x: -20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: 0.2 }} 
                  className="bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl p-6 h-48"
                >
                  <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                    <Activity className="text-[#20C997] size-4" /> Live Execution Result
                  </h2>
                  <PredictionCard result={latestResult} />
                </motion.div>
              </div>

              {/* RIGHT COLUMN: Tracking Registry Table */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2 bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl p-6 flex flex-col min-h-[580px]">
                <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                  <History className="text-[#20C997] size-4" /> Real-Time Tracking Registry
                </h2>
                <div className="flex-1 relative overflow-hidden">
                   <HistoryTable logs={history} />
                </div>
              </motion.div>
            </div>
          </div>

          {/* SENSOR NETWORK TAB */}
          <div className={activeTab === 'network' ? 'block' : 'hidden'}>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-2xl">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white">Grid Matrix & Hardware Telemetry</h2>
                <p className="text-sm text-emerald-100/60 mt-1">Live physical node status and tactical interception mapping.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-1">
                  <HardwareTelemetry />
                </div>
                <div className="lg:col-span-2 bg-black/20 border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                  <h3 className="text-[#20C997] font-mono font-bold text-lg mb-2">NETWORK HEALTH: OPTIMAL</h3>
                  <p className="text-sm text-emerald-100/60 max-w-md">
                    3 Active Nodes Deployed. Mesh Uplink Synchronized. Tap any node on the grid below to view its localized situational diagnostics and active threat logs.
                  </p>
                </div>
              </div>

              <TacticalMap activeAlerts={history.filter(log => log.alert === true)} />
            </div>
          </div>

          {/* Threat Heatmap Tab */}
          <div className={activeTab === 'heatmap' ? 'block' : 'hidden'}>
            <ThreatHeatmap logs={history} />
          </div>

          {/* Biodiversity Score Tab */}
          <div className={activeTab === 'biodiversity' ? 'block' : 'hidden'}>
            <BiodiversityScore logs={history} />
          </div>

          {/* Alerts & Patrol Command Tab */}
          <div className={activeTab === 'alerts' ? 'block' : 'hidden'}>
            <AlertSystem logs={history} />
          </div>

          {/* EcoBot Chat Tab */}
          <div className={activeTab === 'chat' ? 'block' : 'hidden'}>
            <EcoBot />
          </div>

          {/* User Profile Tab */}
          <div className={activeTab === 'profile' ? 'block' : 'hidden'}>
            <UserProfile />
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;