import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Radio, ShieldAlert, Volume2, Sparkles, Loader2 } from 'lucide-react';

const LiveStreamNode = ({ onStreamEventCaptured }) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('Standby');
  const [isProcessing, setIsProcessing] = useState(false);
  const [latestDetection, setLatestDetection] = useState(null);

  const mediaRecorderRef = useRef(null);
  const streamIntervalRef = useRef(null);

  // Initialize and handle the cyclical live recording chunks
  const startAudioStreaming = async () => {
    try {
      // Turn off the browser's noise cancellation so it actually hears the threats!
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        } 
      });
      
      setIsStreaming(true);
      setCurrentStatus('Listening Live Feed...');

      // 🚨 FIX: Increased to 12 seconds to completely avoid Google Gemini Free Tier Rate Limits (15 RPM)
      streamIntervalRef.current = setInterval(() => {
        captureAndAnalyzeChunk(stream);
      }, 12000);

      // Analyze the very first block immediately
      captureAndAnalyzeChunk(stream);
    } catch (err) {
      console.error('Microphone link request denied:', err);
      setCurrentStatus('Microphone Access Error');
    }
  };

  const stopAudioStreaming = () => {
    if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsStreaming(false);
    setIsProcessing(false);
    setCurrentStatus('Standby');
    setLatestDetection(null);
  };

  const captureAndAnalyzeChunk = (stream) => {
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    let audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      // Use 'audio/webm' because that is the browser's native recording format
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      if (audioBlob.size > 1000) { 
        await processLiveFeedChunk(audioBlob);
      }
    };

    // 🚨 FIX: Record a 4.5 second window every 12 seconds
    mediaRecorder.start();
    setTimeout(() => {
      if (mediaRecorder.state !== 'inactive') mediaRecorder.stop();
    }, 4500);
  };

  const processLiveFeedChunk = async (blob) => {
    setIsProcessing(true);
    const formData = new FormData();
    // Save as .webm so the backend parses it correctly
    formData.append('file', blob, 'live_canopy_feed.webm');

    try {
      const response = await fetch('http://localhost:8000/stream-predict', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
         throw new Error(`Server responded with ${response.status}`);
      }
      
      const data = await response.json();

      setLatestDetection(data);
      
      // Cascade structural callbacks upwards to shift the maps & pipelines instantly
      if (onStreamEventCaptured) {
        onStreamEventCaptured(data);
      }
    } catch (err) {
      console.error('Edge Uplink Stream Failure:', err);
      // Fail gracefully so the UI doesn't break during a demo
      setCurrentStatus('Uplink Cooldown. Retrying...');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    return () => {
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
    };
  }, []);

  return (
    <div className={`bg-[#0a120e]/90 backdrop-blur-xl border rounded-2xl p-5 relative overflow-hidden transition-all duration-500 ${
      latestDetection?.alert 
        ? 'border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.15)] bg-red-950/10' 
        : 'border-[#20C997]/30 shadow-[0_0_30px_rgba(32,201,151,0.05)]'
    }`}>
      
      <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-white/5 rounded-xl border border-white/5">
            <Radio className={`size-4 ${isStreaming ? 'text-[#20C997] animate-pulse' : 'text-emerald-100/40'}`} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Live Canopy Audio Uplink</h3>
            <p className="text-[11px] text-emerald-100/50 font-mono mt-0.5">{currentStatus}</p>
          </div>
        </div>

        <button
          onClick={isStreaming ? stopAudioStreaming : startAudioStreaming}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold tracking-tight transition-all flex items-center gap-1.5 active:scale-95 ${
            isStreaming 
              ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30' 
              : 'bg-[#20C997] hover:bg-[#1bb386] text-[#0a120e] shadow-[0_0_15px_rgba(32,201,151,0.2)]'
          }`}
        >
          {isStreaming ? <MicOff className="size-3.5" /> : <Mic className="size-3.5" />}
          {isStreaming ? 'Disconnect Feed' : 'Establish Live Feed'}
        </button>
      </div>

      {/* Cinematic Feedback Area */}
      <div className="bg-black/30 border border-white/5 rounded-xl p-4 flex flex-col justify-center min-h-[90px] relative">
        {isProcessing && (
          <div className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-mono text-[#20C997]">
            <Loader2 className="size-3 animate-spin" /> Analyzing Frame...
          </div>
        )}

        {latestDetection ? (
          <div className="flex items-center justify-between gap-4 animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-full ${latestDetection.alert ? 'bg-red-500/20 text-red-400 animate-ping' : 'bg-emerald-500/20 text-[#20C997]'}`}>
                {latestDetection.alert ? <ShieldAlert className="size-5" /> : <Volume2 className="size-5" />}
              </div>
              <div>
                <span className="text-[10px] font-mono text-emerald-100/40 tracking-wider uppercase block">AI Surveillance Node</span>
                <h4 className={`text-base font-bold font-mono ${latestDetection.alert ? 'text-red-400' : 'text-[#20C997]'}`}>
                  {latestDetection.prediction.toUpperCase()} IDENTIFIED
                </h4>
              </div>
            </div>
            <div className="text-right font-mono">
              <span className="text-[10px] text-emerald-100/40 block">CONFIDENCE</span>
              <span className="text-sm font-bold text-white">{Math.round(latestDetection.confidence * 100)}%</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-xs font-mono text-emerald-100/30 italic">
              {isStreaming ? 'Listening quietly to environmental frequencies...' : 'Uplink down. Connect micro-array to deploy.'}
            </p>
          </div>
        )}
      </div>

    </div>
  );
};

export default LiveStreamNode;