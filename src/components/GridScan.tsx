import React, { useRef, useEffect } from 'react';

interface GridScanProps {
  sensitivity?: number;
  lineThickness?: number;
  linesColor?: string;
  scanColor?: string;
  scanOpacity?: number;
  gridScale?: number;
  lineStyle?: string;
  lineJitter?: number;
  scanDirection?: 'pingpong' | 'loop';
  noiseIntensity?: number;
  scanGlow?: number;
  scanSoftness?: number;
  scanDuration?: number;
  scanDelay?: number;
  scanOnClick?: () => void;
}

const GridScan: React.FC<GridScanProps> = ({
  sensitivity = 0.55,
  lineThickness = 1,
  linesColor = '#06B6D4',
  scanColor = '#f9f2f9',
  scanOpacity = 0.4,
  gridScale = 0.1,
  lineStyle = 'solid',
  lineJitter = 0.1,
  scanDirection = 'pingpong',
  noiseIntensity = 0.01,
  scanGlow = 0.5,
  scanSoftness = 80,
  scanDuration = 2,
  scanDelay = 2,
  scanOnClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let startTime = Date.now();
    let scanPosition = 0;

    // Set initial canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });

    window.addEventListener('resize', resizeCanvas);
    resizeObserver.observe(canvas);

    const animate = () => {
      const now = Date.now();
      const elapsed = (now - startTime) / 1000;

      // Clear canvas with fade trail
      ctx.fillStyle = `rgba(0, 0, 0, ${1 - sensitivity * 0.45})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cellSize = Math.max(canvas.width, canvas.height) * gridScale;

      // Draw grid lines
      ctx.strokeStyle = linesColor;
      ctx.lineWidth = lineThickness;

      // Vertical lines
      for (let x = 0; x < canvas.width; x += cellSize) {
        ctx.beginPath();
        const jitterX = (Math.random() - 0.5) * canvas.width * noiseIntensity * 2;
        ctx.moveTo(x + jitterX, 0);
        ctx.lineTo(x + jitterX, canvas.height);
        ctx.stroke();
      }

      // Horizontal lines
      for (let y = 0; y < canvas.height; y += cellSize) {
        ctx.beginPath();
        const jitterY = (Math.random() - 0.5) * canvas.height * noiseIntensity * 2;
        ctx.moveTo(0, y + jitterY);
        ctx.lineTo(canvas.width, y + jitterY);
        ctx.stroke();
      }

      // Scan bar animation
      const cycleTime = (scanDuration + scanDelay) * 1000;
      const timeSinceLastCycle = elapsed * 1000 % cycleTime;
      const scanActiveTime = scanDuration * 1000;

      if (timeSinceLastCycle < scanActiveTime) {
        const progress = timeSinceLastCycle / scanActiveTime;

        if (scanDirection === 'pingpong') {
          if (Math.floor((elapsed * 1000) / scanActiveTime) % 2 === 0) {
            scanPosition = progress;
          } else {
            scanPosition = 1 - progress;
          }
        } else {
          scanPosition = progress;
        }

        const barY = scanPosition * canvas.height;
        const barHeight = scanSoftness;

        // Draw glow with gradient
        const gradient = ctx.createLinearGradient(
          0,
          barY - barHeight / 2,
          0,
          barY + barHeight / 2
        );
        gradient.addColorStop(0, `rgba(${hexToRgb(scanColor).join(',')}, 0)`);
        gradient.addColorStop(
          0.5,
          `rgba(${hexToRgb(scanColor).join(',')}, ${scanOpacity})`
        );
        gradient.addColorStop(1, `rgba(${hexToRgb(scanColor).join(',')}, 0)`);

        ctx.fillStyle = gradient;
        ctx.shadowBlur = 20 * scanGlow;
        ctx.shadowColor = scanColor;
        ctx.fillRect(0, barY - barHeight / 2, canvas.width, barHeight);
        ctx.shadowBlur = 0;
      }

      animId = requestAnimationFrame(animate);
    };

    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16),
          ]
        : [0, 0, 0];
    };

    animate();

    const handleClick = () => {
      if (scanOnClick) scanOnClick();
    };

    canvas.addEventListener('click', handleClick);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('click', handleClick);
      resizeObserver.disconnect();
    };
  }, [
    sensitivity,
    lineThickness,
    linesColor,
    scanColor,
    scanOpacity,
    gridScale,
    lineStyle,
    lineJitter,
    scanDirection,
    noiseIntensity,
    scanGlow,
    scanSoftness,
    scanDuration,
    scanDelay,
    scanOnClick,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-screen h-screen"
      style={{ display: 'block' }}
    />
  );
};

export default GridScan;
