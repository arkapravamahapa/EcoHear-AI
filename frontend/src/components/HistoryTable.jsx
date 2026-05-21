import React from 'react';
import { motion } from 'framer-motion';

const HistoryTable = ({ logs }) => {
  return (
    <div className="w-full overflow-x-auto h-full max-h-100 overflow-y-auto pr-2">
      <table className="w-full text-left border-collapse">
        <thead className="sticky top-0 bg-[#0d2b18]/90 backdrop-blur-sm z-10">
          <tr className="border-b border-white/10 text-emerald-100/60 text-sm">
            <th className="pb-3 px-4 font-medium">Time</th>
            <th className="pb-3 px-4 font-medium">Classification</th>
            <th className="pb-3 px-4 font-medium">Conf.</th>
            <th className="pb-3 px-4 font-medium text-right">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {logs.map((log, index) => (
            <motion.tr 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              key={index} 
              className="group hover:bg-white/5 transition-colors"
            >
              <td className="py-3 px-4 text-sm text-emerald-100/70 font-mono whitespace-nowrap">{log.timestamp}</td>
              <td className="py-3 px-4 text-sm font-medium text-white capitalize truncate max-w-37.5">{log.prediction}</td>
              <td className="py-3 px-4 text-sm text-emerald-100/70 font-mono">{Math.round(log.confidence * 100)}%</td>
              <td className="py-3 px-4 text-right">
                <span className={`inline-flex px-2 py-1 text-[10px] uppercase tracking-wider font-bold rounded ${
                  log.alert ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-[#20C997]'
                }`}>
                  {log.alert ? 'Alert' : 'Safe'}
                </span>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default HistoryTable;