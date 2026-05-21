import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, Activity, History, ShieldCheck } from 'lucide-react';
import AudioUploader from '../components/AudioUploader';
import PredictionCard from '../components/PredictionCard';
import HistoryTable from '../components/HistoryTable';
import { getDetectionHistory } from '../services/api';

const Dashboard = () => {
  const [latestResult, setLatestResult] = useState(null);
  const [history, setHistory] = useState([]);
  
  // NEW: Fetch real history from your SQLite database on page load
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await getDetectionHistory();
        setHistory(data);
      } catch (error) {
        console.error("Failed to load history on startup");
      }
    };
    fetchHistory();
  }, []);

  const handleNewPrediction = (result) => {
    setLatestResult(result);
    // Add the new result to the top of the history list instantly
    setHistory(prev => [result, ...prev]);
  };

  return (
    <div className="relative min-h-screen w-full text-gray-100">
      
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover -z-20"
        src="/forest-bg.mp4" 
      />

      <div className="fixed inset-0 bg-[#040a06]/40 -z-10"></div>

      <div className="relative z-10 px-4 md:px-8 py-6 max-w-7xl mx-auto space-y-8">
        
        <header className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl px-6 py-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-[#20C997]" />
            <span className="text-2xl font-bold tracking-tight text-white font-['Instrument_Serif',serif]">
              EcoHear<span className="text-[#20C997] italic">.AI</span>
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm font-medium text-[#20C997] bg-[#20C997]/10 px-4 py-2 rounded-full border border-[#20C997]/20">
            <span className="relative flex w-3 h-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#20C997] opacity-75"></span>
              <span className="relative inline-flex rounded-full w-3 h-3 bg-[#20C997]"></span>
            </span>
            Acoustic Nodes Online
          </div>
        </header>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-4 md:py-6">
          <h1 className="text-5xl md:text-6xl font-['Instrument_Serif',serif] text-white mb-3 tracking-tight leading-none">
            The Future of <span className="italic">Smarter</span> Conservation
          </h1>
          <p className="text-emerald-100/60 text-sm md:text-base max-w-xl mx-auto">
            Real-time audio intelligence for continuous ecosystem monitoring and rapid threat response.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 flex flex-col gap-6">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl p-6 flex-1 flex flex-col min-h-70">
              <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <Mic className="text-[#20C997] w-4 h-4" /> Analyze Audio File
              </h2>
              <AudioUploader onPredictionComplete={handleNewPrediction} />
            </motion.div>

            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl p-6 h-50">
              <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <Activity className="text-[#20C997] w-4 h-4" /> Live Execution Result
              </h2>
              <PredictionCard result={latestResult} />
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2 bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl p-6 flex flex-col min-h-125">
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <History className="text-[#20C997] w-4 h-4" /> Real-Time Tracking Registry
            </h2>
            <div className="flex-1 relative overflow-hidden">
               <HistoryTable logs={history} />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;