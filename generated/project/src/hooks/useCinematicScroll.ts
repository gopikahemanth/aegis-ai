import { useEffect, useState, useCallback, useRef } from 'react';
import { audioManager } from '../services/audioManager';

interface UseCinematicScrollOptions {
  totalFrames: number;
  onProgress?: (progress: number, frameIndex: number) => void;
}

export function useCinematicScroll({ totalFrames, onProgress }: UseCinematicScrollOptions) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const lastProgressRef = useRef(0);

  // Preload generated programmatic canvas frames for high fidelity zero-asset dependency
  useEffect(() => {
    let isCancelled = false;
    const loadedImages: HTMLImageElement[] = [];
    let loadedCount = 0;

    // Generate high-end procedural vector frame snapshots into OffscreenCanvas or regular Canvas
    const generateFrameDataUrl = (frameIdx: number, total: number): string => {
      const canvas = document.createElement('canvas');
      canvas.width = 1920;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';

      const progress = frameIdx / (total - 1);

      // Dynamic cinematic background based on progress
      const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      if (progress < 0.25) {
        bgGrad.addColorStop(0, '#0f172a');
        bgGrad.addColorStop(1, '#020617');
      } else if (progress < 0.55) {
        bgGrad.addColorStop(0, '#1e1b4b');
        bgGrad.addColorStop(1, '#0f172a');
      } else if (progress < 0.85) {
        bgGrad.addColorStop(0, '#311026');
        bgGrad.addColorStop(1, '#09050d');
      } else {
        bgGrad.addColorStop(0, '#450a0a');
        bgGrad.addColorStop(1, '#090202');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid floor perspective lines
      ctx.strokeStyle = progress > 0.8 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)';
      ctx.lineWidth = 2;
      for (let i = 0; i < canvas.width; i += 120) {
        ctx.beginPath();
        ctx.moveTo(i, canvas.height);
        ctx.lineTo(canvas.width / 2 + (i - canvas.width / 2) * 0.2, canvas.height * 0.6);
        ctx.stroke();
      }

      // Horizontal grid lines
      for (let y = canvas.height * 0.6; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Mecha Transformer morphing geometry calculation
      ctx.save();
      const cx = canvas.width / 2;
      const cy = canvas.height * 0.65;

      const scale = 1 + progress * 0.4;
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);

      // Morphing from armored truck (progress = 0) to Bipedal Mech (progress = 1)
      const truckWidth = 500 * (1 - progress * 0.4);
      const truckHeight = 220 + progress * 180;

      // Glow aura
      ctx.shadowColor = progress > 0.8 ? '#ef4444' : '#3b82f6';
      ctx.shadowBlur = 30 + progress * 40;

      // Hull body
      const primaryColor = progress > 0.8 ? '#dc2626' : '#2563eb';
      const secondaryColor = '#1e293b';

      ctx.fillStyle = secondaryColor;
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 6;

      if (progress < 0.3) {
        // Truck Mode
        ctx.beginPath();
        ctx.roundRect(-truckWidth / 2, -truckHeight / 2, truckWidth, truckHeight, 20);
        ctx.fill();
        ctx.stroke();

        // Cab windshield
        ctx.fillStyle = '#0ea5e9';
        ctx.fillRect(-truckWidth / 4, -truckHeight / 2 + 30, truckWidth / 2, 80);

        // Wheels
        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.arc(-truckWidth * 0.35, truckHeight / 2, 55, 0, Math.PI * 2);
        ctx.arc(truckWidth * 0.35, truckHeight / 2, 55, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        // Transforming / Robot Mode
        const morphFactor = (progress - 0.3) / 0.7;

        // Torso
        ctx.fillStyle = secondaryColor;
        ctx.beginPath();
        ctx.roundRect(-180, -250, 360, 320 * (0.8 + morphFactor * 0.2), 16);
        ctx.fill();
        ctx.stroke();

        // Reactor Core Glowing Chest
        const coreGradient = ctx.createRadialGradient(0, -100, 10, 0, -100, 100);
        coreGradient.addColorStop(0, '#ffffff');
        coreGradient.addColorStop(0.4, progress > 0.8 ? '#f87171' : '#60a5fa');
        coreGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(0, -100, 80, 0, Math.PI * 2);
        ctx.fill();

        // Head visor
        ctx.fillStyle = '#020617';
        ctx.fillRect(-100, -380, 200, 90);
        ctx.strokeStyle = primaryColor;
        ctx.strokeRect(-100, -380, 200, 90);

        // Glowing Optic Visor
        ctx.fillStyle = progress > 0.8 ? '#ef4444' : '#38bdf8';
        ctx.shadowBlur = 25;
        ctx.fillRect(-70, -345, 140, 20);

        // Articulated Shoulders & Arms
        ctx.fillStyle = secondaryColor;
        ctx.fillRect(-340 * morphFactor, -220, 120, 280);
        ctx.strokeRect(-340 * morphFactor, -220, 120, 280);

        ctx.fillRect(220 * morphFactor, -220, 120, 280);
        ctx.strokeRect(220 * morphFactor, -220, 120, 280);
      }

      ctx.restore();

      // Cinematic HUD overlay grid elements stamped onto canvas for immersion
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.font = '14px monospace';
      ctx.fillText(`SYS_ID: AEGIS_MK${Math.floor(progress * 4) + 1} // SYNC_FRAME: ${frameIdx}/${total}`, 40, 50);
      ctx.fillText(`TRANSFORMATION_INDEX: ${(progress * 100).toFixed(1)}%`, 40, 80);

      return canvas.toDataURL('image/webp', 0.85);
    };

    const loadAllFrames = async () => {
      for (let i = 0; i < totalFrames; i++) {
        if (isCancelled) return;
        const dataUrl = generateFrameDataUrl(i, totalFrames);
        const img = new Image();
        await new Promise((resolve) => {
          img.onload = resolve;
          img.src = dataUrl;
        });
        loadedImages[i] = img;
        loadedCount++;
        setLoadingProgress(Math.round((loadedCount / totalFrames) * 100));
      }

      if (!isCancelled) {
        imagesRef.current = loadedImages;
        setIsLoaded(true);
      }
    };

    loadAllFrames();

    return () => {
      isCancelled = true;
    };
  }, [totalFrames]);

  // Scroll listener mapped to frame index
  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? Math.min(1, Math.max(0, scrollTop / docHeight)) : 0;

    setScrollProgress(progress);
    const frameIdx = Math.min(totalFrames - 1, Math.floor(progress * totalFrames));
    setCurrentFrame(frameIdx);

    const delta = progress - lastProgressRef.current;
    if (Math.abs(delta) > 0.02) {
      audioManager.playTransformSound(delta);
      lastProgressRef.current = progress;
    }

    if (onProgress) {
      onProgress(progress, frameIdx);
    }
  }, [totalFrames, onProgress]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  return {
    scrollProgress,
    currentFrame,
    isLoaded,
    loadingProgress,
    images: imagesRef.current,
  };
}