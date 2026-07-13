import React, { useRef, useState, useEffect } from 'react';

interface LayoutState {
  name: { x: number; y: number; size: number };
  signature: { x: number; y: number; width: number };
  date: { enabled: boolean; x: number; y: number; size: number; format: string; value: string };
}

interface LivePreviewEditorProps {
  templateUrl: string;
  signatureUrl: string | null;
  layout: LayoutState;
  setLayout: React.Dispatch<React.SetStateAction<LayoutState>>;
  selectedFont: string;
}

export default function LivePreviewEditor({
  templateUrl,
  signatureUrl,
  layout,
  setLayout,
  selectedFont
}: LivePreviewEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<'name' | 'signature' | 'date' | null>(null);

  const handlePointerDown = (e: React.PointerEvent, type: 'name' | 'signature' | 'date') => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(type);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;

    // Constrain bounds
    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));

    setLayout(prev => ({
      ...prev,
      [dragging]: {
        ...prev[dragging as keyof LayoutState],
        x,
        y
      }
    }));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragging) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      setDragging(null);
    }
  };

  return (
    <div 
      className="relative w-full rounded-xl overflow-hidden shadow-inner bg-stone-100 border border-stone-200 select-none touch-none @container"
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{ aspectRatio: '1.414 / 1' }} // Default approx A4 landscape ratio, will adjust to image
    >
      {/* Background Template */}
      {templateUrl && (
        <img 
          src={templateUrl} 
          alt="Certificate Template" 
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          onLoad={(e) => {
             const img = e.target as HTMLImageElement;
             if (containerRef.current) {
                containerRef.current.style.aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`;
             }
          }}
        />
      )}

      {/* Rulers / Guides when dragging */}
      {dragging && (
        <>
          {/* Vertical Center */}
          <div className="absolute top-0 bottom-0 w-px bg-blue-400/50 left-1/2 -translate-x-1/2 pointer-events-none z-10" />
          {/* Horizontal Center */}
          <div className="absolute left-0 right-0 h-px bg-blue-400/50 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
          
          {/* Crosshairs for current element */}
          <div 
            className="absolute top-0 bottom-0 w-px bg-blue-500 border-dashed border-l border-white pointer-events-none z-10"
            style={{ left: `${layout[dragging].x}%` }}
          />
          <div 
            className="absolute left-0 right-0 h-px bg-blue-500 border-dashed border-t border-white pointer-events-none z-10"
            style={{ top: `${layout[dragging].y}%` }}
          />
        </>
      )}

      {/* Name Draggable */}
      <div 
        className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-move group z-20"
        style={{ left: `${layout.name.x}%`, top: `${layout.name.y}%` }}
        onPointerDown={(e) => handlePointerDown(e, 'name')}
      >
        <div className={`whitespace-nowrap px-4 py-1 border-2 border-dashed ${dragging === 'name' ? 'border-blue-500 bg-blue-500/10' : 'border-transparent group-hover:border-stone-400/50 group-hover:bg-white/50'} rounded transition-colors`}
          style={{ fontFamily: selectedFont, fontSize: `clamp(1rem, ${layout.name.size}cqi, 4rem)` }}
        >
          Student Name
        </div>
      </div>

      {/* Signature Draggable */}
      {signatureUrl && (
        <div 
          className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-move group z-20"
          style={{ 
            left: `${layout.signature.x}%`, 
            top: `${layout.signature.y}%`,
            width: `${layout.signature.width}%`
          }}
          onPointerDown={(e) => handlePointerDown(e, 'signature')}
        >
          <div className={`w-full h-full border-2 border-dashed ${dragging === 'signature' ? 'border-blue-500 bg-blue-500/10' : 'border-transparent group-hover:border-stone-400/50 group-hover:bg-white/50'} rounded transition-colors`}>
            <img src={signatureUrl} className="w-full h-auto pointer-events-none" alt="Signature" />
          </div>
        </div>
      )}

      {/* Date Draggable */}
      {layout.date.enabled && (
        <div 
          className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-move group z-20"
          style={{ left: `${layout.date.x}%`, top: `${layout.date.y}%` }}
          onPointerDown={(e) => handlePointerDown(e, 'date')}
        >
          <div className={`whitespace-nowrap px-2 py-1 border-2 border-dashed ${dragging === 'date' ? 'border-blue-500 bg-blue-500/10' : 'border-transparent group-hover:border-stone-400/50 group-hover:bg-white/50'} rounded transition-colors`}
            style={{ fontFamily: selectedFont, fontSize: `clamp(0.5rem, ${layout.date.size}cqi, 2rem)` }}
          >
            {layout.date.value || new Date().toLocaleDateString()}
          </div>
        </div>
      )}

    </div>
  );
}
