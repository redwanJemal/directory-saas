import { PrismaClient, AdminRole } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function seedAdminUser() {
  const email = 'admin@directory-saas.local';
  await prisma.adminUser.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash: hashPassword('admin123'),
      firstName: 'Super',
      lastName: 'Admin',
      role: AdminRole.SUPER_ADMIN,
      isActive: true,
    },
  });
  console.log('  ✓ Admin user seeded');
}

async function seedSubscriptionPlans() {
  const plans = [
    {
      name: 'starter',
      displayName: 'Starter',
      description: 'Perfect for small directories getting started',
      priceMonthly: 0,
      priceYearly: 0,
      maxUsers: 3,
      maxStorage: 500, // MB
      features: JSON.stringify(['basic-analytics']),
      sortOrder: 1,
    },
    {
      name: 'professional',
      displayName: 'Professional',
      description: 'For growing directories that need more power',
      priceMonthly: 49,
      priceYearly: 470,
      maxUsers: 25,
      maxStorage: 5000, // MB
      features: JSON.stringify([
        'basic-analytics',
        'advanced-analytics',
        'api-access',
        'custom-domain',
      ]),
      sortOrder: 2,
    },
    {
      name: 'enterprise',
      displayName: 'Enterprise',
      description: 'Full-featured solution for large directories',
      priceMonthly: 199,
      priceYearly: 1900,
      maxUsers: -1, // unlimited
      maxStorage: 50000, // MB
      features: JSON.stringify([
        'basic-analytics',
        'advanced-analytics',
        'api-access',
        'custom-domain',
        'ai-planner',
        'priority-support',
      ]),
      sortOrder: 3,
    },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { name: plan.name },
      update: {},
      create: plan,
    });
  }
  console.log('  ✓ Subscription plans seeded');
}

async function seedPermissions() {
  const permissions = [
    // Tenants
    { resource: 'tenants', action: 'create' },
    { resource: 'tenants', action: 'read' },
    { resource: 'tenants', action: 'update' },
    { resource: 'tenants', action: 'delete' },
    { resource: 'tenants', action: 'manage' },
    // Users
    { resource: 'users', action: 'create' },
    { resource: 'users', action: 'read' },
    { resource: 'users', action: 'update' },
    { resource: 'users', action: 'delete' },
    { resource: 'users', action: 'manage' },
    // Roles
    { resource: 'roles', action: 'create' },
    { resource: 'roles', action: 'read' },
    { resource: 'roles', action: 'update' },
    { resource: 'roles', action: 'delete' },
    { resource: 'roles', action: 'manage' },
    // Subscriptions
    { resource: 'subscriptions', action: 'read' },
    { resource: 'subscriptions', action: 'manage' },
    // Audit logs
    { resource: 'audit-logs', action: 'read' },
    // Settings
    { resource: 'settings', action: 'read' },
    { resource: 'settings', action: 'update' },
  ];

  for (const perm of permissions) {
    const existing = await prisma.permission.findUnique({
      where: { resource_action: { resource: perm.resource, action: perm.action } },
    });
    if (!existing) {
      await prisma.permission.create({
        data: {
          resource: perm.resource,
          action: perm.action,
          description: `Can ${perm.action} ${perm.resource}`,
        },
      });
    }
  }
  console.log('  ✓ Permissions seeded');
}

async function seedDefaultRolesForTenant(tenantId: string) {
  const allPermissions = await prisma.permission.findMany();
  const permByKey = new Map(allPermissions.map((p) => [`${p.resource}:${p.action}`, p.id]));

  const defaultRoles = [
    {
      name: 'OWNER',
      displayName: 'Owner',
      description: 'Full access to all resources',
      isSystem: true,
      permissions: allPermissions.map((p) => `${p.resource}:${p.action}`),
    },
    {
      name: 'ADMIN',
      displayName: 'Admin',
      description: 'All permissions except subscription management',
      isSystem: true,
      permissions: allPermissions
        .filter((p) => !(p.resource === 'subscriptions' && p.action === 'manage'))
        .map((p) => `${p.resource}:${p.action}`),
    },
    {
      name: 'MANAGER',
      displayName: 'Manager',
      description: 'Read/write on domain resources',
      isSystem: true,
      permissions: [
        'users:read', 'users:create', 'users:update',
        'roles:read', 'subscriptions:read', 'audit-logs:read',
        'settings:read', 'settings:update',
      ],
    },
    {
      name: 'MEMBER',
      displayName: 'Member',
      description: 'Read-only access',
      isSystem: true,
      permissions: ['users:read', 'roles:read', 'subscriptions:read', 'settings:read'],
    },
  ];

  for (const roleDef of defaultRoles) {
    const existing = await prisma.role.findUnique({
      where: { tenantId_name: { tenantId, name: roleDef.name } },
    });
    if (existing) continue;

    const role = await prisma.role.create({
      data: {
        tenantId,
        name: roleDef.name,
        displayName: roleDef.displayName,
        description: roleDef.description,
        isSystem: roleDef.isSystem,
      },
    });

    for (const permKey of roleDef.permissions) {
      const permId = permByKey.get(permKey);
      if (permId) {
        await prisma.rolePermission.create({
          data: { roleId: role.id, permissionId: permId },
        });
      }
    }
  }
  console.log('  ✓ Default roles seeded for tenant');
}

async function seedDemoTenant() {
  const slug = 'demo';
  const tenant = await prisma.tenant.upsert({
    where: { slug },
    update: {},
    create: {
      name: 'Demo Directory',
      slug,
      status: 'ACTIVE',
      settings: JSON.stringify({
        timezone: 'Africa/Addis_Ababa',
        currency: 'ETB',
      }),
    },
  });

  // Create owner user for demo tenant
  const ownerEmail = 'owner@demo.directory-saas.local';
  await prisma.tenantUser.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: ownerEmail } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: ownerEmail,
      passwordHash: hashPassword('demo123'),
      firstName: 'Demo',
      lastName: 'Owner',
      role: 'OWNER',
      isActive: true,
      emailVerified: true,
    },
  });

  // Create default roles for demo tenant
  await seedDefaultRolesForTenant(tenant.id);

  // Assign OWNER role to the demo owner user
  const ownerUser = await prisma.tenantUser.findUnique({
    where: { tenantId_email: { tenantId: tenant.id, email: ownerEmail } },
  });
  const ownerRole = await prisma.role.findUnique({
    where: { tenantId_name: { tenantId: tenant.id, name: 'OWNER' } },
  });
  if (ownerUser && ownerRole) {
    const existingAssignment = await prisma.userRole.findUnique({
      where: { userId_roleId: { userId: ownerUser.id, roleId: ownerRole.id } },
    });
    if (!existingAssignment) {
      await prisma.userRole.create({
        data: { userId: ownerUser.id, roleId: ownerRole.id },
      });
    }
  }

  // Assign starter plan to demo tenant
  const starterPlan = await prisma.subscriptionPlan.findUnique({
    where: { name: 'starter' },
  });
  if (starterPlan) {
    await prisma.tenantSubscription.upsert({
      where: { tenantId: tenant.id },
      update: {},
      create: {
        tenantId: tenant.id,
        planId: starterPlan.id,
        status: 'ACTIVE',
        startedAt: new Date(),
        renewsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });
  }

  console.log('  ✓ Demo tenant seeded');
}

async function main() {
  console.log('Seeding database...');
  await seedAdminUser();
  await seedSubscriptionPlans();
  await seedPermissions();
  await seedDemoTenant();
  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
