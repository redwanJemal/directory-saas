import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { type ColumnDef, type SortingState } from '@tanstack/react-table';
import { Eye, Pencil, Trash2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import {
  DataTableRowActions,
  type RowAction,
} from '@/components/data-table/data-table-row-actions';
import { useRolesQuery, useDeleteRoleMutation } from './hooks/use-roles';
import { CreateRoleDialog } from './components/create-role-dialog';
import { EditRoleDialog } from './components/edit-role-dialog';
import { ViewRoleSheet } from './components/view-role-sheet';
import type { Role } from './types';

function sortingToApiSort(sorting: SortingState): string | undefined {
  if (sorting.length === 0) return undefined;
  return sorting.map((s) => (s.desc ? `-${s.id}` : s.id)).join(',');
}

export function RolesPage() {
  const { t } = useTranslation();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [viewRole, setViewRole] = useState<Role | null>(null);
  const [deleteRole, setDeleteRole] = useState<Role | null>(null);

  const deleteMutation = useDeleteRoleMutation();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, sorting]);

  const { data, isLoading } = useRolesQuery({
    page,
    pageSize,
    search: debouncedSearch || undefined,
    sort: sortingToApiSort(sorting),
  });

  function handleDelete() {
    if (!deleteRole) return;
    deleteMutation.mutate(deleteRole.id, {
      onSuccess: () => {
        toast.success(t('roles.roleDeleted'));
        setDeleteRole(null);
      },
      onError: () => {
        toast.error(t('errors.serverError'));
      },
    });
  }

  const columns = useMemo<ColumnDef<Role, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('roles.roleName')} />
        ),
        cell: ({ row }) => (
          <span className="font-medium">{row.getValue('name')}</span>
        ),
      },
      {
        accessorKey: 'tenant',
        header: () => t('roles.tenantLabel'),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.tenant?.name ?? t('roles.platform')}
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'permissions',
        header: () => t('roles.permissionsCount'),
        cell: ({ row }) => <span>{row.original.permissions.length}</span>,
        enableSorting: false,
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('roles.createdAt')}
          />
        ),
        cell: ({ row }) => (
          <span>
            {format(new Date(row.getValue('createdAt')), 'MMM d, yyyy')}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => t('common.actions'),
        cell: ({ row }) => {
          const role = row.original;
          const actions: RowAction[] = [
            {
              label: t('common.view'),
              icon: Eye,
              onClick: () => setViewRole(role),
            },
            {
              label: t('common.edit'),
              icon: Pencil,
              onClick: () => setEditRole(role),
            },
            {
              label: t('common.delete'),
              icon: Trash2,
              onClick: () => setDeleteRole(role),
              variant: 'destructive',
              separator: true,
            },
          ];
          return <DataTableRowActions actions={actions} />;
        },
        enableSorting: false,
      },
    ],
    [t],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          {t('roles.title')}
        </h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('roles.createRole')}
        </Button>
      </div>

      <DataTableToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('roles.searchPlaceholder')}
        filters={[]}
      />

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        pageCount={data?.pagination?.totalPages ?? 0}
        page={page}
        pageSize={pageSize}
        totalCount={data?.pagination?.totalCount ?? 0}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        onSortingChange={setSorting}
        sorting={sorting}
        isLoading={isLoading}
      />

      <CreateRoleDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditRoleDialog
        open={!!editRole}
        onOpenChange={(open) => !open && setEditRole(null)}
        role={editRole}
      />
      <ViewRoleSheet
        open={!!viewRole}
        onOpenChange={(open) => !open && setViewRole(null)}
        role={viewRole}
      />

      <AlertDialog
        open={!!deleteRole}
        onOpenChange={(open) => !open && setDeleteRole(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('roles.confirmDeleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('roles.confirmDeleteMessage')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending
                ? t('common.loading')
                : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
