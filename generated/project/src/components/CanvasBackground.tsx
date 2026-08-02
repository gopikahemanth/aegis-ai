import React, { useEffect, useRef } from 'react';

interface CanvasBackgroundProps {
  images: HTMLImageElement[];
  currentFrame: number;
  isLoaded: boolean;
}

export const CanvasBackground: React.FC<CanvasBackgroundProps> = ({ images, currentFrame, isLoaded }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isLoaded || images.length === 0) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const img = images[currentFrame] || images[0];
    if (img) {
      ctx.clearRect(0, 0, width, height);

      // Object fit cover calculation
      const hRatio = width / img.width;
      const vRatio = height / img.height;
      const ratio = Math.max(hRatio, vRatio);
      const centerShiftX = (width - img.width * ratio) / 2;
      const centerShiftY = (height - img.height * ratio) / 2;

      ctx.drawImage(
        img,
        0,
        0,
        img.width,
        img.height,
        centerShiftX,
        centerShiftY,
        img.width * ratio,
        img.height * ratio
      );
    }
  }, [images, currentFrame, isLoaded]);

  // Window resize handler
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-slate-950">
      <canvas ref={canvasRef} className="w-full h-full block" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/60 pointer-events-none" />
    </div>
  );
};