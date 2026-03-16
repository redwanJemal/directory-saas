import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils';
import { DataTable } from '../data-table';
import { type ColumnDef } from '@tanstack/react-table';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'common.noResults': 'No results.',
        'table.showing': 'Showing',
        'table.of': 'of',
        'table.rowsPerPage': 'Rows per page',
        'table.page': 'Page',
        'table.first': 'First',
        'table.previous': 'Previous',
        'table.next': 'Next',
        'table.last': 'Last',
      };
      return translations[key] ?? key;
    },
    i18n: { changeLanguage: vi.fn() },
  }),
}));

interface TestData {
  id: string;
  name: string;
}

const columns: ColumnDef<TestData, string>[] = [
  { accessorKey: 'name', header: 'Name' },
];

describe('DataTable', () => {
  it('renders data rows', () => {
    const data = [
      { id: '1', name: 'Item One' },
      { id: '2', name: 'Item Two' },
    ];
    render(<DataTable columns={columns} data={data} />);
    expect(screen.getByText('Item One')).toBeInTheDocument();
    expect(screen.getByText('Item Two')).toBeInTheDocument();
  });

  it('renders empty state when no data', () => {
    render(<DataTable columns={columns} data={[]} />);
    expect(screen.getByText('No results.')).toBeInTheDocument();
  });

  it('renders loading skeleton when isLoading', () => {
    render(<DataTable columns={columns} data={[]} isLoading />);
    expect(screen.queryByText('No results.')).not.toBeInTheDocument();
  });
});
