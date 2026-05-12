import { useCallback, useEffect, useRef, useState } from 'react';

export default function useAsync(asyncFn, deps = [], options = {}) {
  const { immediate = true, initialData = null } = options;

  const mountedRef = useRef(false);
  const [loading, setLoading] = useState(immediate);
  const [data, setData] = useState(initialData);
  const [error, setError] = useState(null);

  const run = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const result = await asyncFn(...args);
        if (mountedRef.current) setData(result);
        return result;
      } catch (err) {
        if (mountedRef.current) setError(err);
        throw err;
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!immediate) return;
    run();
  }, [immediate, run]);

  return { loading, data, error, run, setData };
}
