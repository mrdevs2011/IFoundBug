'use client';

import React, { useRef, useState, useEffect } from 'react';
import { PenToolIcon, CheckIcon, XIcon, DownloadIcon } from './icons';

interface ImageAnnotatorProps {
  imageUrl: string;
  onSave?: (annotatedDataUrl: string) => void;
  onClose?: () => void;
}

type Tool = 'box' | 'arrow' | 'pen' | 'blur' | 'text';

export const ImageAnnotator: React.FC<ImageAnnotatorProps> = ({ imageUrl, onSave, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedTool, setSelectedTool] = useState<Tool>('box');
  const [color, setColor] = useState<string>('#ef4444');
  const [lineWidth, setLineWidth] = useState<number>(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [history, setHistory] = useState<ImageData[]>([]);
  const imageObjRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      imageObjRef.current = img;
      canvas.width = img.naturalWidth || 800;
      canvas.height = img.naturalHeight || 600;
      ctx.drawImage(img, 0, 0);
      saveState();
    };
  }, [imageUrl]);

  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setHistory((prev) => [...prev.slice(-10), ctx.getImageData(0, 0, canvas.width, canvas.height)]);
  };

  const undo = () => {
    if (history.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const nextHistory = [...history];
    nextHistory.pop(); // remove current
    const previousState = nextHistory[nextHistory.length - 1];
    ctx.putImageData(previousState, 0, 0);
    setHistory(nextHistory);
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    setIsDrawing(true);
    setStartPos(coords);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (selectedTool === 'pen') {
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPos) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentCoords = getCanvasCoords(e);

    if (selectedTool === 'pen') {
      ctx.lineTo(currentCoords.x, currentCoords.y);
      ctx.stroke();
    } else {
      // Restore latest saved state before drawing preview
      if (history.length > 0) {
        ctx.putImageData(history[history.length - 1], 0, 0);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;

      if (selectedTool === 'box') {
        ctx.strokeRect(startPos.x, startPos.y, currentCoords.x - startPos.x, currentCoords.y - startPos.y);
      } else if (selectedTool === 'arrow') {
        drawArrow(ctx, startPos.x, startPos.y, currentCoords.x, currentCoords.y);
      } else if (selectedTool === 'blur') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(startPos.x, startPos.y, currentCoords.x - startPos.x, currentCoords.y - startPos.y);
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentCoords = getCanvasCoords(e);

    if (selectedTool === 'text') {
      const text = prompt('Belgilash matnini kiriting:');
      if (text) {
        ctx.font = `bold ${Math.max(16, lineWidth * 5)}px Inter, sans-serif`;
        ctx.fillStyle = color;
        ctx.fillText(text, currentCoords.x, currentCoords.y);
      }
    }

    saveState();
    setStartPos(null);
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, fromx: number, fromy: number, tox: number, toy: number) => {
    const headlen = 15;
    const dx = tox - fromx;
    const dy = toy - fromy;
    const angle = Math.atan2(dy, dx);
    ctx.beginPath();
    ctx.moveTo(fromx, fromy);
    ctx.lineTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  };

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    if (onSave) onSave(dataUrl);
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-md p-4">
      {/* Top Bar Controls */}
      <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 mb-3 shadow-2xl">
        <div className="flex items-center space-x-2">
          <span className="text-emerald-400 font-bold flex items-center gap-2 text-sm uppercase tracking-wider">
            <PenToolIcon className="w-4 h-4" /> Bug Annotation Studio
          </span>
        </div>

        {/* Tools */}
        <div className="flex items-center space-x-2 bg-zinc-950/80 p-1 rounded-lg border border-zinc-800">
          <button
            onClick={() => setSelectedTool('box')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${selectedTool === 'box' ? 'bg-emerald-500 text-black font-semibold' : 'text-zinc-400 hover:text-white'}`}
          >
            To‘rtburchak
          </button>
          <button
            onClick={() => setSelectedTool('arrow')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${selectedTool === 'arrow' ? 'bg-emerald-500 text-black font-semibold' : 'text-zinc-400 hover:text-white'}`}
          >
            Strelka
          </button>
          <button
            onClick={() => setSelectedTool('pen')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${selectedTool === 'pen' ? 'bg-emerald-500 text-black font-semibold' : 'text-zinc-400 hover:text-white'}`}
          >
            Qalam
          </button>
          <button
            onClick={() => setSelectedTool('blur')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${selectedTool === 'blur' ? 'bg-emerald-500 text-black font-semibold' : 'text-zinc-400 hover:text-white'}`}
          >
            Maxfiy (PII Blur)
          </button>
          <button
            onClick={() => setSelectedTool('text')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${selectedTool === 'text' ? 'bg-emerald-500 text-black font-semibold' : 'text-zinc-400 hover:text-white'}`}
          >
            Matn
          </button>
        </div>

        {/* Colors & Width */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            {['#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#ec4899'].map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-5 h-5 rounded-full border-2 transition ${color === c ? 'border-white scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <button
            onClick={undo}
            disabled={history.length <= 1}
            className="px-2.5 py-1 text-xs text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 rounded"
          >
            Orqaga
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs px-3.5 py-2 rounded-lg shadow-lg transition"
          >
            <CheckIcon className="w-3.5 h-3.5" /> Saqlash & Belgilash
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition"
            >
              <XIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="flex-1 flex items-center justify-center overflow-auto rounded-xl border border-zinc-800/80 bg-zinc-950 p-2">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="max-h-full max-w-full object-contain cursor-crosshair rounded shadow-2xl"
        />
      </div>
    </div>
  );
};
