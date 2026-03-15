export class PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;

  constructor(
    items: T[],
    total: number,
    page: number,
    pageSize: number,
  ) {
    this.items = items;
    this.total = total;
    this.page = page;
    this.pageSize = pageSize;
    this.totalPages = Math.ceil(total / pageSize);
  }
}

export function paginate<T>(
  items: T[],
  total: number,
  query: { page: number; pageSize: number },
): PaginatedResult<T> {
  return new PaginatedResult(items, total, query.page, query.pageSize);
}
