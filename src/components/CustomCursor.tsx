import { useEffect, useState } from 'react';

export function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [clicking, setClicking] = useState(false);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [isOnGreen, setIsOnGreen] = useState(false);

  useEffect(() => {
    const updatePosition = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      
      // Detectar se o cursor está sobre um elemento verde
      const elementUnderCursor = document.elementFromPoint(e.clientX, e.clientY);
      if (elementUnderCursor) {
        const computedStyle = window.getComputedStyle(elementUnderCursor);
        const bgColor = computedStyle.backgroundColor;
        const textColor = computedStyle.color;
        const borderColor = computedStyle.borderColor;
        
        // Verificar se alguma cor é verde (hsl 151 ou rgb verde)
        const isGreen = 
          bgColor.includes('151') || 
          bgColor.includes('rgb(0, 200') || 
          bgColor.includes('rgb(0, 190') ||
          bgColor.includes('rgb(16, 185') ||
          textColor.includes('151') ||
          borderColor.includes('151') ||
          elementUnderCursor.classList.contains('bg-primary') ||
          elementUnderCursor.classList.contains('text-primary') ||
          elementUnderCursor.classList.contains('border-primary') ||
          elementUnderCursor.closest('.bg-primary') ||
          elementUnderCursor.closest('.text-primary') ||
          elementUnderCursor.closest('[class*="primary"]');
        
        setIsOnGreen(!!isGreen);
      }
    };

    const handleMouseDown = () => {
      setClicking(true);
      const newRipple = { id: Date.now(), x: position.x, y: position.y };
      setRipples(prev => [...prev, newRipple]);
      
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id));
      }, 1000);
    };

    const handleMouseUp = () => {
      setClicking(false);
    };

    window.addEventListener('mousemove', updatePosition);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', updatePosition);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [position.x, position.y]);

  return (
    <>
      {/* Main cursor */}
      <div
        className={`custom-cursor ${isOnGreen ? 'on-green' : ''}`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
      />
      
      {/* Cursor trail */}
      <div
        className={`custom-cursor-trail ${clicking ? 'clicking' : ''} ${isOnGreen ? 'on-green' : ''}`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
      />

      {/* Click ripple effects */}
      {ripples.map((ripple) => (
        <div
          key={ripple.id}
          className={`cursor-ripple ${isOnGreen ? 'on-green' : ''}`}
          style={{
            left: `${ripple.x}px`,
            top: `${ripple.y}px`,
          }}
        />
      ))}
    </>
  );
}
