export const PERMISSIONS = [
  // Tenants (admin only)
  { resource: 'tenants', action: 'create', description: 'Can create tenants' },
  { resource: 'tenants', action: 'read', description: 'Can read tenants' },
  { resource: 'tenants', action: 'update', description: 'Can update tenants' },
  { resource: 'tenants', action: 'delete', description: 'Can delete tenants' },
  { resource: 'tenants', action: 'manage', description: 'Full access to tenants' },

  // Users
  { resource: 'users', action: 'create', description: 'Can create users' },
  { resource: 'users', action: 'read', description: 'Can read users' },
  { resource: 'users', action: 'update', description: 'Can update users' },
  { resource: 'users', action: 'delete', description: 'Can delete users' },
  { resource: 'users', action: 'manage', description: 'Full access to users' },

  // Roles
  { resource: 'roles', action: 'create', description: 'Can create roles' },
  { resource: 'roles', action: 'read', description: 'Can read roles' },
  { resource: 'roles', action: 'update', description: 'Can update roles' },
  { resource: 'roles', action: 'delete', description: 'Can delete roles' },
  { resource: 'roles', action: 'manage', description: 'Full access to roles' },

  // Subscriptions
  { resource: 'subscriptions', action: 'read', description: 'Can read subscriptions' },
  { resource: 'subscriptions', action: 'manage', description: 'Full access to subscriptions' },

  // Audit logs
  { resource: 'audit-logs', action: 'read', description: 'Can read audit logs' },

  // Settings
  { resource: 'settings', action: 'read', description: 'Can read settings' },
  { resource: 'settings', action: 'update', description: 'Can update settings' },
];

export interface DefaultRoleDefinition {
  name: string;
  displayName: string;
  description: string;
  isSystem: boolean;
  permissions: string[]; // "resource:action" format
}

export const DEFAULT_ROLES: DefaultRoleDefinition[] = [
  {
    name: 'OWNER',
    displayName: 'Owner',
    description: 'Full access to all resources',
    isSystem: true,
    permissions: PERMISSIONS.map((p) => `${p.resource}:${p.action}`),
  },
  {
    name: 'ADMIN',
    displayName: 'Admin',
    description: 'All permissions except subscription management',
    isSystem: true,
    permissions: PERMISSIONS.filter(
      (p) => !(p.resource === 'subscriptions' && p.action === 'manage'),
    ).map((p) => `${p.resource}:${p.action}`),
  },
  {
    name: 'MANAGER',
    displayName: 'Manager',
    description: 'Read/write on domain resources',
    isSystem: true,
    permissions: [
      'users:read',
      'users:create',
      'users:update',
      'roles:read',
      'subscriptions:read',
      'audit-logs:read',
      'settings:read',
      'settings:update',
    ],
  },
  {
    name: 'MEMBER',
    displayName: 'Member',
    description: 'Read-only access',
    isSystem: true,
    permissions: [
      'users:read',
      'roles:read',
      'subscriptions:read',
      'settings:read',
    ],
  },
];
