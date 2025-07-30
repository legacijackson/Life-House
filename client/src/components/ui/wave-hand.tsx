import { useEffect, useState } from 'react';

export default function WaveHand() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('chatSeen')) {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-10 h-10 animate-wave pointer-events-none z-50">
      <span className="text-2xl">👋</span>
    </div>
  );
}