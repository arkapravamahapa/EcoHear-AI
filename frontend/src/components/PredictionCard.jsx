import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Volume2 } from 'lucide-react';

const PredictionCard = ({ result }) => {
  if (!result) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-emerald-100/40 min-h-45">
        <Volume2 className="w-8 h-8 mb-3 opacity-50" />
        <p className="text-sm text-center px-4">Waiting for audio stream analysis...</p>
      </div>
    );
  }

  const { alert, prediction, confidence } = result;
  const percentage = Math.round(confidence * 100);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={result.timestamp}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`relative overflow-hidden rounded-xl p-5 border h-full flex flex-col justify-center ${
          alert ? 'bg-red-500/10 border-red-500/30' : 'bg-emerald-500/10 border-emerald-500/30'
        }`}
      >
        <div className={`absolute -top-10 -right-10 w-32 h-32 blur-3xl rounded-full opacity-20 ${alert ? 'bg-red-500' : 'bg-[#20C997]'}`} />
        
        <div className="relative flex items-start gap-4">
          <div className={`mt-1 rounded-full p-2 ${alert ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-[#20C997]'}`}>
            {alert ? <AlertTriangle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
          </div>
          
          <div className="flex-1 w-full">
            <h3 className="text-lg font-bold text-white capitalize truncate">{prediction}</h3>
            <p className={`text-sm mt-1 font-medium ${alert ? 'text-red-400' : 'text-[#20C997]'}`}>
              {alert ? '🚨 CRITICAL THREAT DETECTED' : '✅ SAFE WILDLIFE DETECTED'}
            </p>
            
            <div className="mt-5 w-full">
              <div className="flex justify-between text-xs text-white mb-1.5">
                <span>Confidence Score</span>
                <span className="font-mono">{percentage}%</span>
              </div>
              <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={`h-full rounded-full ${alert ? 'bg-red-500' : 'bg-[#20C997]'}`}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PredictionCard;