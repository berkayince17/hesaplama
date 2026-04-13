"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type HeatFlowCanvasProps = {
  boxLengthCm: number;
  panelThicknessMm: number;
  profilePositionsMm: number[];
  totalHeatLossW: number;
  hasThermalBridgeRisk: boolean;
  hasDirectMetalContact: boolean;
};

export function HeatFlowCanvas({
  boxLengthCm,
  panelThicknessMm,
  profilePositionsMm,
  totalHeatLossW,
  hasThermalBridgeRisk,
  hasDirectMetalContact,
}: HeatFlowCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const particles = Array.from({ length: 24 }, (_, index) => ({
      seed: index * 31.7,
      speed: 0.6 + (index % 5) * 0.15,
      offset: (index % 6) * 14,
    }));

    let animationFrame = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const draw = (time: number) => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const meter = Math.max(width - 80, 1);
      const heatIntensity = Math.min(totalHeatLossW / 1400, 1);

      context.clearRect(0, 0, width, height);

      const gradient = context.createLinearGradient(24, 0, width - 24, 0);
      gradient.addColorStop(0, "rgba(249, 115, 22, 0.26)");
      gradient.addColorStop(0.45, "rgba(250, 204, 21, 0.18)");
      gradient.addColorStop(1, "rgba(14, 165, 233, 0.20)");
      context.fillStyle = gradient;
      context.fillRect(24, 28, width - 48, height - 56);

      context.strokeStyle = "rgba(148, 163, 184, 0.28)";
      context.lineWidth = 1;
      context.strokeRect(24, 28, width - 48, height - 56);

      context.fillStyle = "rgba(255,255,255,0.9)";
      context.font = "12px Space Grotesk, sans-serif";
      context.fillText("Warm side", 30, 22);
      context.fillText("Cold side", width - 84, 22);

      const scaleX = meter / Math.max(boxLengthCm * 10, 1);
      profilePositionsMm.forEach((position, index) => {
        const x =
          index === 0
            ? 28
            : index === profilePositionsMm.length - 1
              ? width - 34
              : 28 + position * scaleX;

        context.fillStyle = hasDirectMetalContact
          ? "rgba(244, 63, 94, 0.62)"
          : "rgba(148, 163, 184, 0.48)";
        context.fillRect(x, 36, 4, height - 72);
      });

      particles.forEach((particle, index) => {
        const progress = ((time * 0.001 * particle.speed) + particle.seed) % 1;
        const x = 32 + progress * (width - 64);
        const y =
          50 +
          ((index * 19 + Math.sin(time * 0.001 + particle.seed) * 18 + particle.offset) %
            (height - 100));

        const radius = 1.5 + heatIntensity * 2 + (index % 3) * 0.4;
        context.beginPath();
        context.fillStyle = hasThermalBridgeRisk
          ? "rgba(251, 113, 133, 0.85)"
          : "rgba(34, 211, 238, 0.85)";
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
      });

      context.fillStyle = "rgba(15, 23, 42, 0.84)";
      context.fillRect(32, height - 42, width - 64, 16);
      context.fillStyle = "rgba(251, 146, 60, 0.95)";
      context.fillRect(32, height - 42, (width - 64) * heatIntensity, 16);

      context.fillStyle = "rgba(255,255,255,0.84)";
      context.fillText(`Heat flow ${totalHeatLossW.toFixed(1)} W`, 36, height - 30);
      context.fillText(`Panel ${panelThicknessMm} mm`, width - 110, height - 30);

      animationFrame = window.requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    animationFrame = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
    };
  }, [
    boxLengthCm,
    hasDirectMetalContact,
    hasThermalBridgeRisk,
    panelThicknessMm,
    profilePositionsMm,
    totalHeatLossW,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        "h-[240px] w-full rounded-[28px] border border-white/10 bg-slate-950/70",
        hasThermalBridgeRisk && "engine-glow",
      )}
    />
  );
}
