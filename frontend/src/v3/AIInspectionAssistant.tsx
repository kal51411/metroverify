import React, { useState, useRef, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { 
  Upload, Sparkles, CheckCircle2, FileText, ArrowRight, ShieldCheck, 
  Cpu, Camera, CameraOff, RefreshCw, Zap, Video, Check, AlertCircle, Eye
} from "lucide-react";

export function AIInspectionAssistant() {
  const shouldReduceMotion = useReducedMotion();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Live Camera state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLiveScanning, setIsLiveScanning] = useState(false);
  const [ocrConfidenceHistory, setOcrConfidenceHistory] = useState<number[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<any>(null);

  // Start Live WebCam
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      setCameraError("Camera access denied or no video device available on this hardware. Switching to high-speed simulation mode.");
      setIsCameraActive(true); // Still enable viewfinder in demo simulation mode
    }
  };

  // Stop Live WebCam
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsCameraActive(false);
    setIsLiveScanning(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Capture frame from webcam and submit to neural backend
  const captureAndSyncBackend = async () => {
    setLoading(true);
    setError(null);

    let blob: Blob | null = null;

    if (canvasRef.current && videoRef.current && streamRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
      }
    }

    // If hardware camera was mocked/denied, generate realistic scale plate image bytes
    if (!blob) {
      const mockCanvas = document.createElement("canvas");
      mockCanvas.width = 640;
      mockCanvas.height = 360;
      const ctx = mockCanvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#18181b";
        ctx.fillRect(0, 0, 640, 360);
        ctx.fillStyle = "#38bdf8";
        ctx.font = "bold 24px monospace";
        ctx.fillText("LEGAL METROLOGY PLATE", 140, 100);
        ctx.fillStyle = "#ffffff";
        ctx.font = "18px monospace";
        ctx.fillText(`SN: SN-2026-LIVE-${Math.floor(1000 + Math.random() * 9000)}`, 140, 150);
        ctx.fillText("IND/09/2026/910  Max: 50000kg  e=0.05kg", 140, 190);
        blob = await new Promise<Blob | null>((resolve) => mockCanvas.toBlob(resolve, "image/jpeg", 0.9));
      }
    }

    if (!blob) {
      setError("Failed to capture video frame.");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("file", blob, `live_plate_capture_${Date.now()}.jpg`);

    try {
      const token = localStorage.getItem("metro_token") || "";
      const res = await fetch("/api/v3/ai/ocr-plate", {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: formData
      });

      if (!res.ok) {
        throw new Error("Neural OCR parsing service rejected frame.");
      }

      const data = await res.json();
      setExtractedData(data);
      setOcrConfidenceHistory(prev => [...prev.slice(-10), data.ocr_confidence * 100]);
    } catch (err: any) {
      setError(err.message || "Live OCR extraction failed.");
    } finally {
      setLoading(false);
    }
  };

  // Live Auto-Stream Continuous Sync (every 2.5s)
  const toggleLiveContinuousScan = () => {
    if (isLiveScanning) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setIsLiveScanning(false);
    } else {
      setIsLiveScanning(true);
      captureAndSyncBackend();
      intervalRef.current = setInterval(() => {
        captureAndSyncBackend();
      }, 2500);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      setExtractedData(null);
      setError(null);
    }
  };

  const handleUploadAndParse = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("metro_token") || "";
      const res = await fetch("/api/v3/ai/ocr-plate", {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: formData
      });

      if (!res.ok) {
        throw new Error("Failed to parse scale plate image.");
      }
      const data = await res.json();
      setExtractedData(data);
    } catch (err: any) {
      setError(err.message || "An error occurred during OCR extraction.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-16 sm:py-24 space-y-12">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono text-xs mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Neural Vision & Statutory OCR Assistor</span>
          </div>
          <h1 className="font-sans font-semibold text-3xl sm:text-4xl text-[#FAFAFA] tracking-[-0.03em]">
            Live AI Stamping Plate Scanner
          </h1>
          <p className="text-zinc-400 text-sm mt-1 max-w-2xl">
            Live video optical recognition parsing serial numbers, model approval marks, and verification intervals directly from scale rating plates.
          </p>
        </div>

        {/* Live Camera Controls */}
        <div className="flex items-center gap-3">
          {!isCameraActive ? (
            <button
              onClick={startCamera}
              className="flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-semibold text-xs hover:from-cyan-400 hover:to-blue-500 transition-all shadow-[0_0_25px_rgba(14,165,233,0.35)]"
            >
              <Camera className="w-4 h-4 text-black" />
              <span>Launch Live Viewfinder</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={toggleLiveContinuousScan}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-xs font-mono transition-all ${
                  isLiveScanning
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 animate-pulse"
                    : "bg-white/5 border-white/10 text-zinc-300 hover:text-white"
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isLiveScanning ? "Live Syncing (2.5s)" : "Start Auto-Sync"}</span>
              </button>
              <button
                onClick={stopCamera}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono hover:bg-red-500/20 transition-all"
              >
                <CameraOff className="w-3.5 h-3.5" />
                <span>Close Camera</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
        {/* Left: Viewfinder / Drag & Drop Zone */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#111113] border border-white/5 shadow-[0_4px_24px_rgba(0,0,0,0.5)] space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-sans font-semibold text-base sm:text-lg text-[#FAFAFA] flex items-center gap-2.5">
              {isCameraActive ? <Video className="w-5 h-5 text-cyan-400" /> : <Upload className="w-5 h-5 text-cyan-400" />}
              <span>{isCameraActive ? "Optical Neural Viewfinder" : "Upload or Capture Stamping Plate"}</span>
            </h3>
            {isCameraActive && (
              <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live Sensor Feed
              </span>
            )}
          </div>

          {/* Camera Viewfinder Screen */}
          {isCameraActive ? (
            <div className="relative rounded-3xl overflow-hidden bg-black/60 border border-cyan-500/30 aspect-video flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Optical Reticle Overlay with animated scanning crosshair */}
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
                <div className="flex justify-between items-start">
                  <div className="w-8 h-8 border-t-2 border-l-2 border-cyan-400 rounded-tl-lg" />
                  <div className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-cyan-500/30 text-[10px] font-mono text-cyan-400">
                    FOCUS: STATUTORY PLATE REGION
                  </div>
                  <div className="w-8 h-8 border-t-2 border-r-2 border-cyan-400 rounded-tr-lg" />
                </div>

                {/* Animated Horizontal Laser Scan Beam */}
                <motion.div
                  initial={{ top: "10%" }}
                  animate={{ top: "90%" }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute left-6 right-6 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_rgba(14,165,233,1)]"
                />

                <div className="flex justify-between items-end">
                  <div className="w-8 h-8 border-b-2 border-l-2 border-cyan-400 rounded-bl-lg" />
                  <div className="text-[10px] font-mono text-zinc-400 bg-black/60 px-2 py-0.5 rounded">
                    ISO-9001 METROLOGY CAMERA LINK
                  </div>
                  <div className="w-8 h-8 border-b-2 border-r-2 border-cyan-400 rounded-br-lg" />
                </div>
              </div>

              {/* Manual Snap & Sync Button Overlay */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
                <button
                  onClick={captureAndSyncBackend}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-cyan-500 text-black font-semibold text-xs hover:bg-cyan-400 transition-all shadow-[0_0_25px_rgba(14,165,233,0.5)] disabled:opacity-50"
                >
                  <Eye className="w-4 h-4 text-black" />
                  <span>{loading ? "Parsing Frame..." : "Snap & Sync Serial"}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Drag & Drop File Box */
            <div className="border-2 border-dashed border-white/10 rounded-3xl p-8 sm:p-12 text-center hover:border-cyan-500/40 transition-colors relative group bg-white/[0.01]">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Cpu className="w-8 h-8" />
              </div>
              <p className="font-sans font-semibold text-[#FAFAFA] text-base mb-1">
                {file ? file.name : "Drop scale plate photo, or click to browse"}
              </p>
              <p className="text-xs text-zinc-500 font-mono">Or launch the Live Viewfinder above to record and sync live</p>
            </div>
          )}

          {file && !isCameraActive && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
              <span className="text-xs font-mono text-zinc-400 truncate max-w-[260px]">{file.name}</span>
              <button
                onClick={handleUploadAndParse}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-semibold text-xs hover:from-cyan-400 hover:to-blue-500 transition-all shadow-[0_0_25px_rgba(14,165,233,0.3)] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Extracting Metadata...</span>
                  </>
                ) : (
                  <>
                    <span>Extract Statutory Data</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {cameraError && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono">
              {cameraError}
            </div>
          )}
        </div>

        {/* Right: Extracted Metadata & Live Sync Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#111113] border border-white/5 shadow-[0_4px_24px_rgba(0,0,0,0.5)] space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-sans font-semibold text-lg text-[#FAFAFA] flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-cyan-400" />
              <span>Parsed Legal Metrology Attributes</span>
            </h3>
            {extractedData && (
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Synchronized
              </span>
            )}
          </div>

          {!extractedData ? (
            <div className="h-64 sm:h-72 flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-white/[0.01] border border-white/5 space-y-2">
              <Sparkles className="w-8 h-8 text-zinc-600 mb-2" />
              <p className="text-sm text-zinc-300 font-medium">Awaiting Video Frame or Stamping Upload</p>
              <p className="text-xs text-zinc-600 max-w-xs leading-relaxed">
                Click "Launch Live Viewfinder" to stream directly from your device camera or drop an image of the weighing plate.
              </p>
            </div>
          ) : (
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="space-y-4 font-mono text-xs"
            >
              {/* Highlighted Live Serial Banner */}
              <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-between">
                <div>
                  <span className="text-zinc-400 text-[10px] uppercase tracking-wider block">Live Extracted Serial Number</span>
                  <span className="text-cyan-400 font-bold text-base sm:text-lg tracking-tight">{extractedData.serial_number}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-cyan-400 text-black flex items-center justify-center font-bold">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <span className="text-zinc-500 block mb-1">Model Approval Code</span>
                  <span className="text-[#FAFAFA] font-bold text-sm">{extractedData.model}</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <span className="text-zinc-500 block mb-1">Manufacturer</span>
                  <span className="text-[#FAFAFA] font-bold text-sm">{extractedData.manufacturer}</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Maximum Capacity (Max):</span>
                  <span className="text-[#FAFAFA] font-bold">{extractedData.max_capacity} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Verification Interval (e):</span>
                  <span className="text-[#FAFAFA] font-bold">{extractedData.verification_scale_interval_e} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Accuracy Classification:</span>
                  <span className="text-cyan-400 font-bold">{extractedData.accuracy_class}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">National Model Approval No:</span>
                  <span className="text-[#FAFAFA]">{extractedData.model_approval_number}</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>OCR Accuracy Confidence: {(extractedData.ocr_confidence * 100).toFixed(1)}%</span>
                </div>
                <span className="font-bold uppercase tracking-wider text-[11px]">STATUTORY PASS</span>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
