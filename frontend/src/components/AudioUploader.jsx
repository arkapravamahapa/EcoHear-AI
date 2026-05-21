import React, { useState, useRef } from 'react';
import { UploadCloud, FileAudio, Loader2, X } from 'lucide-react';
import { predictAudio } from '../services/api';

const AudioUploader = ({ onPredictionComplete }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    
    try {
      // Call the real API connected to your backend
      const result = await predictAudio(file);
      
      // Ensure we have a timestamp for the table
      const finalResult = {
        ...result,
        timestamp: result.timestamp || new Date().toLocaleTimeString()
      };
      
      onPredictionComplete(finalResult);
      
    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to connect to the AI server. Is the backend running?");
    } finally {
      // Reset the uploader state
      setFile(null);
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full justify-between">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const droppedFile = e.dataTransfer.files?.[0];
          if (droppedFile) setFile(droppedFile);
        }}
        onClick={() => !file && fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl transition-all duration-300 flex-1 ${
          isDragging ? 'border-[#20C997] bg-[#20C997]/10' : 
          file ? 'border-emerald-500/50 bg-emerald-900/20' : 
          'border-white/20 bg-white/5 hover:border-[#20C997]/30 hover:bg-white/10 cursor-pointer'
        }`}
      >
        <input type="file" ref={fileInputRef} className="hidden" accept="audio/*" onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])} />
        
        {file ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <FileAudio className="w-6 h-6 text-[#20C997]" />
              </div>
              <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="absolute -top-2 -right-2 bg-red-500/20 text-red-400 hover:bg-red-500/40 rounded-full p-1 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </div>
            <p className="text-sm font-medium text-white truncate max-w-50">{file.name}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-center text-emerald-100/60">
            <UploadCloud className="w-8 h-8 text-[#20C997] mb-2" />
            <p className="text-sm font-medium text-white">Click or drag audio file here</p>
          </div>
        )}
      </div>

      <button
        onClick={handleUpload}
        disabled={!file || isUploading}
        className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-[#20C997] hover:bg-emerald-400 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
      >
        {isUploading ? <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing...</> : 'Run AI Analysis'}
      </button>
    </div>
  );
};

export default AudioUploader;