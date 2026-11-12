import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  isPlaying: boolean;
  barCount?: number;
  className?: string;
  color?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isPlaying,
  barCount = 18,
  className = 'h-6 w-24',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const heightsRef = useRef<number[]>([]);

  useEffect(() => {
    // Initialize heights
    heightsRef.current = Array.from({ length: barCount }, () => Math.random() * 0.4 + 0.1);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let step = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const barWidth = Math.max(2, (width / barCount) - 2);
      const gap = 2;

      step += 0.08;

      for (let i = 0; i < barCount; i++) {
        let targetHeight = 0.15;
        if (isPlaying) {
          // Dynamic harmonic equation based on bar index and time step
          const wave1 = Math.sin(step + i * 0.45);
          const wave2 = Math.cos(step * 1.5 + i * 0.3);
          const noise = Math.sin(step * 2.8 + i * 1.1) * 0.2;
          targetHeight = Math.max(0.12, Math.min(0.95, (wave1 + wave2 + 2) / 4 + noise));
        }

        // Smooth transition to target height
        heightsRef.current[i] += (targetHeight - heightsRef.current[i]) * 0.25;
        const currentBarHeight = heightsRef.current[i] * height;

        const x = i * (barWidth + gap);
        const y = height - currentBarHeight;

        // Subtle gradient for each bar
        const gradient = ctx.createLinearGradient(0, y, 0, height);
        gradient.addColorStop(0, '#c084fc'); // purple-400
        gradient.addColorStop(0.6, '#a855f7'); // purple-500
        gradient.addColorStop(1, '#6366f1'); // indigo-500

        ctx.fillStyle = isPlaying ? gradient : 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, Math.max(3, currentBarHeight), 2);
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, barCount]);

  return (
    <canvas
      ref={canvasRef}
      width={120}
      height={32}
      className={`${className} pointer-events-none`}
      aria-hidden="true"
    />
  );
};
