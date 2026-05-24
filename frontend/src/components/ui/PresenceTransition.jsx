import * as React from 'react';

const PresenceTransition = ({ open, exitDuration = 300, children }) => {
  const [mounted, setMounted] = React.useState(open);
  const [phase, setPhase] = React.useState(open ? 'open' : 'closed');
  const closeTimeoutRef = React.useRef(null);
  const firstFrameRef = React.useRef(null);
  const secondFrameRef = React.useRef(null);

  React.useEffect(() => {
    window.clearTimeout(closeTimeoutRef.current);
    window.cancelAnimationFrame(firstFrameRef.current);
    window.cancelAnimationFrame(secondFrameRef.current);

    if (open) {
      setMounted(true);
      setPhase('opening');
      closeTimeoutRef.current = window.setTimeout(() => {
        setPhase('open');
      }, 25);
      firstFrameRef.current = window.requestAnimationFrame(() => {
        secondFrameRef.current = window.requestAnimationFrame(() => setPhase('open'));
      });
      return undefined;
    }

    if (!mounted) {
      setPhase('closed');
      return undefined;
    }

    setPhase('closing');
    closeTimeoutRef.current = window.setTimeout(() => {
      setMounted(false);
      setPhase('closed');
    }, exitDuration);

    return () => window.clearTimeout(closeTimeoutRef.current);
  }, [open, exitDuration, mounted]);

  React.useEffect(() => {
    return () => {
      window.clearTimeout(closeTimeoutRef.current);
      window.cancelAnimationFrame(firstFrameRef.current);
      window.cancelAnimationFrame(secondFrameRef.current);
    };
  }, []);

  if (!mounted && !open) return null;

  return children({
    phase,
    isOpen: phase === 'open' || phase === 'opening',
    isClosing: phase === 'closing',
  });
};

export default PresenceTransition;
