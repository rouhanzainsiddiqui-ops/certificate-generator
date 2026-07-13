import React, { useEffect, useState, useCallback } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  angle: number;
  speed: number;
}

export default function ClickEffect() {
  const [particles, setParticles] = useState<Particle[]>([]);

  // Google colors for the pop effect
  const colors = ['#4285F4', '#EA4335', '#FBBC05', '#34A853'];

  const handleClick = useCallback((e: MouseEvent) => {
    // Only trigger if we aren't clicking an input that might need normal interaction focus
    // though pointer-events-none on the particle container usually handles this
    const newParticles: Particle[] = [];
    const numParticles = 8;
    for (let i = 0; i < numParticles; i++) {
      newParticles.push({
        id: Date.now() + i + Math.random(),
        x: e.clientX,
        y: e.clientY,
        color: colors[Math.floor(Math.random() * colors.length)],
        angle: (Math.PI * 2 * i) / numParticles + (Math.random() * 0.5),
        speed: Math.random() * 4 + 4,
      });
    }
    setParticles((prev) => [...prev, ...newParticles]);
    
    // Remove particles after animation completes
    setTimeout(() => {
      setParticles((prev) => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 600);
  }, []);

  useEffect(() => {
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [handleClick]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute w-2.5 h-2.5 rounded-full animate-pop shadow-sm"
          style={{
            left: p.x - 5,
            top: p.y - 5,
            backgroundColor: p.color,
            '--tx': `${Math.cos(p.angle) * p.speed * 12}px`,
            '--ty': `${Math.sin(p.angle) * p.speed * 12}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
