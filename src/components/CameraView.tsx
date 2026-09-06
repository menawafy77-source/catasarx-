import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CameraViewProps {
  onCapture: (base64: string) => void;
  onClose: () => void;
}

export default function CameraView({ onCapture, onClose }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError('Could not access camera. Please check permissions.');
      console.error(err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  const retake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const confirmCapture = () => {
    if (capturedImage) {
      const base64Data = capturedImage.split(',')[1];
      onCapture(base64Data);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex justify-between items-center p-4 text-white">
        <h2 className="text-lg font-semibold">مسح السؤال</h2>
        <button onClick={onClose} className="p-2 bg-white/10 rounded-full">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 relative overflow-hidden flex items-center justify-center">
        {error ? (
          <div className="text-white text-center p-4">
            <p>{error}</p>
            <button 
              onClick={startCamera}
              className="mt-4 px-6 py-2 bg-blue-600 rounded-lg"
            >
              حاول مرة أخرى
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className={`w-full h-full object-cover ${capturedImage ? 'hidden' : 'block'}`}
            />
            {capturedImage && (
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full h-full object-contain"
              />
            )}
          </>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="p-8 flex justify-center items-center gap-8 bg-black/50 backdrop-blur-md">
        {!capturedImage ? (
          <button
            onClick={captureFrame}
            className="w-20 h-20 bg-white rounded-full flex items-center justify-center border-4 border-gray-400 active:scale-95 transition-transform"
          >
            <div className="w-16 h-16 bg-white rounded-full border-2 border-black" />
          </button>
        ) : (
          <div className="flex gap-12">
            <button
              onClick={retake}
              className="flex flex-col items-center gap-2 text-white"
            >
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <RefreshCw className="w-8 h-8" />
              </div>
              <span className="text-sm font-medium">إعادة التقاط</span>
            </button>
            <button
              onClick={confirmCapture}
              className="flex flex-col items-center gap-2 text-white"
            >
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8" />
              </div>
              <span className="text-sm font-medium">استخدام الصورة</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
