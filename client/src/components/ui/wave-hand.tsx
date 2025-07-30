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
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center animate-wave pointer-events-none z-50">
      <span className="text-4xl">👋</span>
    </div>
  );
}