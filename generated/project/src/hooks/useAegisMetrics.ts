import { useState, useEffect } from 'react';

interface ThreatMetrics {
  mitigatedThreats: number;
  activeShields: number;
  systemLatencyMs: number;
  accuracyPercentage: number;
}

export const useAegisMetrics = (refreshInterval: number = 2000) => {
  const [metrics, setMetrics] = useState<ThreatMetrics>({
    mitigatedThreats: 148920,
    activeShields: 1024,
    systemLatencyMs: 4.2,
    accuracyPercentage: 99.98,
  });

  const [isStreaming, setIsStreaming] = useState<boolean>(true);

  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      setMetrics((prev) => ({
        mitigatedThreats: prev.mitigatedThreats + Math.floor(Math.random() * 12) + 1,
        activeShields: 1024 + Math.floor(Math.random() * 5) - 2,
        systemLatencyMs: Number((4.0 + Math.random() * 0.5).toFixed(2)),
        accuracyPercentage: Number((99.95 + Math.random() * 0.04).toFixed(2)),
      }));
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [isStreaming, refreshInterval]);

  return {
    metrics,
    isStreaming,
    toggleStreaming: () => setIsStreaming((prev) => !prev),
  };
};