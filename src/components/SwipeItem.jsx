import { useRef } from 'react';
import { FLAGS } from '../constants.js';

export default function SwipeItem({ children, onSwipeLeft, style }) {
  const ref = useRef();
  const startX = useRef(0);
  const curX   = useRef(0);
  const active = useRef(false);

  const handleStart = e => { startX.current = e.touches[0].clientX; active.current = true; };
  const handleMove  = e => {
    if (!active.current) return;
    const dx = e.touches[0].clientX - startX.current;
    curX.current = dx;
    if (dx < 0 && ref.current) ref.current.style.transform = `translateX(${Math.max(dx, -120)}px)`;
  };
  const handleEnd = () => {
    if (!active.current) return;
    active.current = false;
    if (curX.current < -60) {
      if (ref.current) ref.current.style.transform = "translateX(-100%)";
      setTimeout(() => onSwipeLeft && onSwipeLeft(), 200);
    } else {
      if (ref.current) ref.current.style.transform = "";
    }
    curX.current = 0;
  };

  if (!FLAGS.swipeGestures) return <div style={style}>{children}</div>;
  return (
    <div className="swipe-row" style={style}
      onTouchStart={handleStart} onTouchMove={handleMove} onTouchEnd={handleEnd}>
      <div className="swipe-bg">🗑 Entfernen</div>
      <div className="swipe-content" ref={ref}>{children}</div>
    </div>
  );
}
