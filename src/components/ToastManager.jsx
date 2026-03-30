import { useState, useEffect } from 'react';
import { FLAGS } from '../constants.js';
import { setToastSetter } from '../toast.js';

export default function ToastManager() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    setToastSetter((msg) => {
      const id = Date.now();
      setToasts(t => [...t, { id, msg }]);
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2500);
    });
    return () => setToastSetter(null);
  }, []);

  if (!FLAGS.toasts || !toasts.length) return null;
  return (
    <div className="toast-container">
      {toasts.map(t => <div key={t.id} className="toast toast-enter">{t.msg}</div>)}
    </div>
  );
}
