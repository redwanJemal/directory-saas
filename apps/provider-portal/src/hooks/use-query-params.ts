import { useCallback } from 'react';
import { useSearchParams } from 'react-router';

export function useQueryParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const getParam = useCallback(
    (key: string) => searchParams.get(key) || '',
    [searchParams],
  );

  const setParam = useCallback(
    (key: string, value: string) => {
      setSearchParams((prev) => {
        if (value) prev.set(key, value);
        else prev.delete(key);
        return prev;
      });
    },
    [setSearchParams],
  );

  const setParams = useCallback(
    (params: Record<string, string>) => {
      setSearchParams((prev) => {
        Object.entries(params).forEach(([key, value]) => {
          if (value) prev.set(key, value);
          else prev.delete(key);
        });
        return prev;
      });
    },
    [setSearchParams],
  );

  const clearParams = useCallback(
    (keys?: string[]) => {
      setSearchParams((prev) => {
        if (keys) {
          keys.forEach((key) => prev.delete(key));
        } else {
          const keysToKeep = ['page', 'pageSize'];
          const allKeys = Array.from(prev.keys());
          allKeys.forEach((key) => {
            if (!keysToKeep.includes(key)) prev.delete(key);
          });
        }
        return prev;
      });
    },
    [setSearchParams],
  );

  return { getParam, setParam, setParams, clearParams, searchParams };
}
