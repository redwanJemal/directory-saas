import { useTranslation } from 'react-i18next';
import { Checkbox } from '@/components/ui/checkbox';

const resources = [
  'tenants',
  'users',
  'roles',
  'subscriptions',
  'audit',
  'settings',
];
const actions = ['create', 'read', 'update', 'delete', 'manage'];

interface PermissionsGridProps {
  selectedPermissions: string[];
  onPermissionsChange: (permissions: string[]) => void;
}

export function PermissionsGrid({
  selectedPermissions,
  onPermissionsChange,
}: PermissionsGridProps) {
  const { t } = useTranslation();

  function isChecked(resource: string, action: string): boolean {
    return selectedPermissions.includes(`${resource}:${action}`);
  }

  function togglePermission(resource: string, action: string) {
    const perm = `${resource}:${action}`;
    if (selectedPermissions.includes(perm)) {
      onPermissionsChange(selectedPermissions.filter((p) => p !== perm));
    } else {
      onPermissionsChange([...selectedPermissions, perm]);
    }
  }

  function toggleRow(resource: string) {
    const rowPerms = actions.map((a) => `${resource}:${a}`);
    const allSelected = rowPerms.every((p) => selectedPermissions.includes(p));
    if (allSelected) {
      onPermissionsChange(
        selectedPermissions.filter((p) => !rowPerms.includes(p)),
      );
    } else {
      const newPerms = new Set([...selectedPermissions, ...rowPerms]);
      onPermissionsChange(Array.from(newPerms));
    }
  }

  function toggleColumn(action: string) {
    const colPerms = resources.map((r) => `${r}:${action}`);
    const allSelected = colPerms.every((p) => selectedPermissions.includes(p));
    if (allSelected) {
      onPermissionsChange(
        selectedPermissions.filter((p) => !colPerms.includes(p)),
      );
    } else {
      const newPerms = new Set([...selectedPermissions, ...colPerms]);
      onPermissionsChange(Array.from(newPerms));
    }
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
              {t('roles.resource')}
            </th>
            {actions.map((action) => (
              <th key={action} className="px-3 py-3 text-center">
                <button
                  type="button"
                  className="text-xs font-medium capitalize text-muted-foreground hover:text-foreground"
                  onClick={() => toggleColumn(action)}
                >
                  {t(`roles.action_${action}`)}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {resources.map((resource) => (
            <tr
              key={resource}
              className="border-b border-border last:border-0"
            >
              <td className="px-4 py-3">
                <button
                  type="button"
                  className="text-sm font-medium capitalize hover:text-primary"
                  onClick={() => toggleRow(resource)}
                >
                  {t(`roles.resource_${resource}`)}
                </button>
              </td>
              {actions.map((action) => (
                <td key={action} className="px-3 py-3 text-center">
                  <Checkbox
                    checked={isChecked(resource, action)}
                    onCheckedChange={() => togglePermission(resource, action)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
