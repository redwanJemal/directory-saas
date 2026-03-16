import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { type ColumnDef } from '@tanstack/react-table';
import { formatDistanceToNow } from 'date-fns';
import { UserPlus, Shield, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/data-table';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { DataTableRowActions, type RowAction } from '@/components/data-table/data-table-row-actions';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { useTeamMembers } from './hooks/use-team';
import { InviteMemberDialog } from './components/invite-member-dialog';
import { ChangeRoleDialog } from './components/change-role-dialog';
import { RemoveMemberDialog } from './components/remove-member-dialog';
import type { TeamMember } from './types';

export function TeamPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');

  const [inviteOpen, setInviteOpen] = useState(false);
  const [changeRoleMember, setChangeRoleMember] = useState<TeamMember | null>(null);
  const [changeRoleOpen, setChangeRoleOpen] = useState(false);
  const [removeMember, setRemoveMember] = useState<TeamMember | null>(null);
  const [removeOpen, setRemoveOpen] = useState(false);

  const { data, isLoading } = useTeamMembers({ page, pageSize, search });

  function getActions(member: TeamMember): RowAction[] {
    return [
      {
        label: t('team.changeRole'),
        onClick: () => { setChangeRoleMember(member); setChangeRoleOpen(true); },
        icon: Shield,
      },
      {
        label: t('team.removeMember'),
        onClick: () => { setRemoveMember(member); setRemoveOpen(true); },
        icon: Trash2,
        variant: 'destructive',
        separator: true,
      },
    ];
  }

  const columns = useMemo<ColumnDef<TeamMember, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('team.name')} />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
              {row.original.name.charAt(0).toUpperCase()}
            </div>
            <span className="font-medium">{row.original.name}</span>
          </div>
        ),
      },
      {
        accessorKey: 'email',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('team.email')} />
        ),
      },
      {
        accessorKey: 'role',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('team.role')} />
        ),
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.role}</Badge>
        ),
      },
      {
        accessorKey: 'joinedAt',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('team.joined')} />
        ),
        cell: ({ row }) =>
          formatDistanceToNow(new Date(row.original.joinedAt), { addSuffix: true }),
      },
      {
        id: 'actions',
        cell: ({ row }) => <DataTableRowActions actions={getActions(row.original)} />,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t('team.title')}</h1>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          {t('team.inviteMember')}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <DataTableToolbar
            searchValue={search}
            onSearchChange={(v) => { setSearch(v); setPage(1); }}
            searchPlaceholder={t('team.searchPlaceholder')}
          />
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={data?.data ?? []}
            page={page}
            pageSize={pageSize}
            totalCount={data?.pagination?.totalCount ?? 0}
            pageCount={data?.pagination?.totalPages ?? 0}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      <InviteMemberDialog open={inviteOpen} onOpenChange={setInviteOpen} />

      <ChangeRoleDialog
        member={changeRoleMember}
        open={changeRoleOpen}
        onOpenChange={setChangeRoleOpen}
      />

      <RemoveMemberDialog
        member={removeMember}
        open={removeOpen}
        onOpenChange={setRemoveOpen}
      />
    </div>
  );
}
