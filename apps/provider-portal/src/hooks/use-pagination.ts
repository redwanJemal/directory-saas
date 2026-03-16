import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';

interface PaginationOptions {
  defaultPageSize?: number;
}

export function usePagination({ defaultPageSize = 20 }: PaginationOptions = {}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get('page')) || 1;
  const pageSize = Number(searchParams.get('pageSize')) || defaultPageSize;

  const setPage = useCallback(
    (newPage: number) => {
      setSearchParams((prev) => {
        prev.set('page', String(newPage));
        return prev;
      });
    },
    [setSearchParams],
  );

  const setPageSize = useCallback(
    (newPageSize: number) => {
      setSearchParams((prev) => {
        prev.set('pageSize', String(newPageSize));
        prev.set('page', '1');
        return prev;
      });
    },
    [setSearchParams],
  );

  return useMemo(
    () => ({ page, pageSize, setPage, setPageSize }),
    [page, pageSize, setPage, setPageSize],
  );
}
