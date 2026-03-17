import { PrismaClient, AdminRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function seedAdminUser() {
  const email = 'admin@directory-saas.local';
  const hashedAdmin = await hashPassword('admin123');
  await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash: hashedAdmin },
    create: {
      email,
      passwordHash: hashedAdmin,
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
      maxStorage: 500,
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
      maxStorage: 5000,
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
      maxUsers: -1,
      maxStorage: 50000,
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
    { resource: 'tenants', action: 'create' },
    { resource: 'tenants', action: 'read' },
    { resource: 'tenants', action: 'update' },
    { resource: 'tenants', action: 'delete' },
    { resource: 'tenants', action: 'manage' },
    { resource: 'users', action: 'create' },
    { resource: 'users', action: 'read' },
    { resource: 'users', action: 'update' },
    { resource: 'users', action: 'delete' },
    { resource: 'users', action: 'manage' },
    { resource: 'roles', action: 'create' },
    { resource: 'roles', action: 'read' },
    { resource: 'roles', action: 'update' },
    { resource: 'roles', action: 'delete' },
    { resource: 'roles', action: 'manage' },
    { resource: 'subscriptions', action: 'read' },
    { resource: 'subscriptions', action: 'manage' },
    { resource: 'audit-logs', action: 'read' },
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

// === Ethiopian Business Categories ===

interface CategoryDef {
  name: string;
  slug: string;
  icon: string;
  color?: string;
  children?: Omit<CategoryDef, 'color' | 'children'>[];
}

const CATEGORIES: CategoryDef[] = [
  {
    name: 'Food & Drink', slug: 'food-drink', icon: 'utensils', color: '#ef4444',
    children: [
      { name: 'Restaurant', slug: 'restaurant', icon: 'chef-hat' },
      { name: 'Catering', slug: 'catering', icon: 'cooking-pot' },
      { name: 'Home Cook', slug: 'home-cook', icon: 'home' },
      { name: 'Grocery & Spices', slug: 'grocery-spices', icon: 'shopping-basket' },
      { name: 'Bakery & Sweets', slug: 'bakery-sweets', icon: 'cake' },
      { name: 'Coffee & Cafe', slug: 'coffee-cafe', icon: 'coffee' },
    ],
  },
  {
    name: 'Beauty & Grooming', slug: 'beauty-grooming', icon: 'scissors', color: '#ec4899',
    children: [
      { name: 'Salon', slug: 'salon', icon: 'sparkles' },
      { name: 'Barber', slug: 'barber', icon: 'scissors' },
      { name: 'Braiding & Hair', slug: 'braiding-hair', icon: 'ribbon' },
      { name: 'Henna & Makeup', slug: 'henna-makeup', icon: 'palette' },
      { name: 'Cosmetics Shop', slug: 'cosmetics-shop', icon: 'shopping-bag' },
    ],
  },
  {
    name: 'Services', slug: 'services', icon: 'briefcase', color: '#3b82f6',
    children: [
      { name: 'PRO & Typing Center', slug: 'pro-typing', icon: 'file-text' },
      { name: 'Translation', slug: 'translation', icon: 'languages' },
      { name: 'Money Transfer', slug: 'money-transfer', icon: 'banknote' },
      { name: 'Travel Agency', slug: 'travel-agency', icon: 'plane' },
      { name: 'Cargo & Shipping', slug: 'cargo-shipping', icon: 'package' },
      { name: 'Legal & Labor', slug: 'legal-labor', icon: 'scale' },
      { name: 'Real Estate', slug: 'real-estate', icon: 'building' },
    ],
  },
  {
    name: 'Automotive', slug: 'automotive', icon: 'car', color: '#f59e0b',
    children: [
      { name: 'Mechanic & Garage', slug: 'mechanic-garage', icon: 'wrench' },
      { name: 'Car Wash', slug: 'car-wash', icon: 'droplets' },
      { name: 'Driving School', slug: 'driving-school', icon: 'graduation-cap' },
    ],
  },
  {
    name: 'Health & Wellness', slug: 'health-wellness', icon: 'heart-pulse', color: '#22c55e',
    children: [
      { name: 'Traditional Medicine', slug: 'traditional-medicine', icon: 'leaf' },
      { name: 'Massage & Spa', slug: 'massage-spa', icon: 'flower' },
      { name: 'Clinic & Pharmacy', slug: 'clinic-pharmacy', icon: 'stethoscope' },
    ],
  },
  {
    name: 'Shopping', slug: 'shopping', icon: 'shopping-cart', color: '#8b5cf6',
    children: [
      { name: 'Clothing & Fashion', slug: 'clothing-fashion', icon: 'shirt' },
      { name: 'Electronics', slug: 'electronics', icon: 'smartphone' },
      { name: 'Furniture', slug: 'furniture', icon: 'sofa' },
      { name: 'General Trading', slug: 'general-trading', icon: 'store' },
    ],
  },
  {
    name: 'Community', slug: 'community', icon: 'users', color: '#06b6d4',
    children: [
      { name: 'Church & Mosque', slug: 'church-mosque', icon: 'landmark' },
      { name: 'Community Center', slug: 'community-center', icon: 'building-2' },
      { name: 'Tutoring & Education', slug: 'tutoring-education', icon: 'book-open' },
      { name: 'Events & Entertainment', slug: 'events-entertainment', icon: 'music' },
    ],
  },
];

async function seedCategories() {
  let sortOrder = 0;

  for (const cat of CATEGORIES) {
    const parent = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { icon: cat.icon, color: cat.color, sortOrder },
      create: {
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        color: cat.color,
        sortOrder,
        isActive: true,
      },
    });
    sortOrder++;

    if (cat.children) {
      let childOrder = 0;
      for (const child of cat.children) {
        await prisma.category.upsert({
          where: { slug: child.slug },
          update: { icon: child.icon, parentId: parent.id, sortOrder: childOrder },
          create: {
            name: child.name,
            slug: child.slug,
            icon: child.icon,
            parentId: parent.id,
            sortOrder: childOrder,
            isActive: true,
          },
        });
        childOrder++;
      }
    }
  }

  console.log('  ✓ Ethiopian business categories seeded');
}

// === Demo Businesses ===

interface DemoBusiness {
  tenantName: string;
  tenantSlug: string;
  ownerEmail: string;
  ownerFirst: string;
  ownerLast: string;
  profile: {
    bio: string;
    description: string;
    phone: string;
    email: string;
    whatsapp: string;
    instagram?: string;
    country: string;
    city: string;
    address: string;
    businessHours: Record<string, { open: string; close: string }>;
  };
  categorySlugs: { slug: string; isPrimary: boolean }[];
  packages: { name: string; description: string; price: number; currency: string; features: string[] }[];
  faqs: { question: string; answer: string }[];
}

const DEMO_BUSINESSES: DemoBusiness[] = [
  {
    tenantName: 'Habesha Kitchen',
    tenantSlug: 'habesha-kitchen',
    ownerEmail: 'owner@habesha-kitchen.local',
    ownerFirst: 'Tigist',
    ownerLast: 'Bekele',
    profile: {
      bio: 'Authentic Ethiopian cuisine in the heart of Deira, Dubai',
      description: 'Habesha Kitchen brings the rich flavors of Ethiopia to Dubai. Our menu features traditional dishes like injera with various wots, tibs, kitfo, and a full Ethiopian coffee ceremony. We also offer catering for events and parties, plus a grocery section with Ethiopian spices and ingredients.',
      phone: '+971501234567',
      email: 'info@habesha-kitchen.ae',
      whatsapp: '+971501234567',
      instagram: 'habesha_kitchen_dxb',
      country: 'UAE',
      city: 'Dubai',
      address: 'Deira, Al Murar Street',
      businessHours: {
        mon: { open: '10:00', close: '23:00' },
        tue: { open: '10:00', close: '23:00' },
        wed: { open: '10:00', close: '23:00' },
        thu: { open: '10:00', close: '23:00' },
        fri: { open: '14:00', close: '23:00' },
        sat: { open: '10:00', close: '23:00' },
        sun: { open: '10:00', close: '23:00' },
      },
    },
    categorySlugs: [
      { slug: 'restaurant', isPrimary: true },
      { slug: 'catering', isPrimary: false },
      { slug: 'grocery-spices', isPrimary: false },
    ],
    packages: [
      { name: 'Dine-In', description: 'Full menu dining experience', price: 50, currency: 'AED', features: ['Full Ethiopian menu', 'Coffee ceremony', 'Traditional seating available'] },
      { name: 'Catering (Small)', description: 'Catering for up to 20 people', price: 800, currency: 'AED', features: ['Injera platters', 'Choice of 4 wots', 'Delivery included', 'Plates & utensils'] },
      { name: 'Catering (Large)', description: 'Catering for 50+ people', price: 2500, currency: 'AED', features: ['Injera platters', 'Choice of 6 wots', 'Delivery & setup', 'Service staff', 'Coffee ceremony'] },
    ],
    faqs: [
      { question: 'Do you offer vegetarian options?', answer: 'Yes! We have a full vegetarian/vegan menu including misir wot, gomen, shiro, and various beyaynetu combinations.' },
      { question: 'Can you cater for large events?', answer: 'Absolutely. We cater events from 10 to 500+ guests. Contact us via WhatsApp for custom quotes.' },
    ],
  },
  {
    tenantName: 'Queen Beauty Salon',
    tenantSlug: 'queen-beauty-salon',
    ownerEmail: 'owner@queen-beauty.local',
    ownerFirst: 'Hanna',
    ownerLast: 'Tadesse',
    profile: {
      bio: 'Ethiopian hair braiding, styling, and beauty services in Bur Dubai',
      description: 'Queen Beauty Salon specializes in Ethiopian and Eritrean hair braiding, cornrows, extensions, and styling. We also offer henna art, makeup services, and a curated selection of Ethiopian beauty products.',
      phone: '+971502345678',
      email: 'info@queen-beauty.ae',
      whatsapp: '+971502345678',
      instagram: 'queen_beauty_burdubai',
      country: 'UAE',
      city: 'Dubai',
      address: 'Bur Dubai, Meena Bazaar',
      businessHours: {
        mon: { open: '09:00', close: '21:00' },
        tue: { open: '09:00', close: '21:00' },
        wed: { open: '09:00', close: '21:00' },
        thu: { open: '09:00', close: '21:00' },
        fri: { open: '14:00', close: '21:00' },
        sat: { open: '09:00', close: '21:00' },
        sun: { open: '09:00', close: '21:00' },
      },
    },
    categorySlugs: [
      { slug: 'salon', isPrimary: true },
      { slug: 'braiding-hair', isPrimary: false },
      { slug: 'cosmetics-shop', isPrimary: false },
    ],
    packages: [
      { name: 'Braiding', description: 'Ethiopian-style hair braiding', price: 150, currency: 'AED', features: ['Cornrows', 'Box braids', 'Goddess locs', 'Free consultation'] },
      { name: 'Full Glam', description: 'Makeup and styling for events', price: 300, currency: 'AED', features: ['Full makeup', 'Hair styling', 'Henna (optional)', 'Touch-up kit'] },
      { name: 'Bridal Package', description: 'Complete bridal beauty package', price: 1200, currency: 'AED', features: ['Bridal makeup', 'Hair styling', 'Henna', 'Trial session', 'Day-of touch-ups'] },
    ],
    faqs: [
      { question: 'How long does braiding take?', answer: 'Depending on the style, braiding takes 2-6 hours. We recommend booking in advance for weekend appointments.' },
      { question: 'Do you use natural products?', answer: 'Yes, we prioritize natural and organic hair products, including Ethiopian-sourced shea butter and oils.' },
    ],
  },
  {
    tenantName: 'Abyssinia Travel',
    tenantSlug: 'abyssinia-travel',
    ownerEmail: 'owner@abyssinia-travel.local',
    ownerFirst: 'Dawit',
    ownerLast: 'Mekonnen',
    profile: {
      bio: 'Ethiopian travel agency and cargo shipping services in Sharjah',
      description: 'Abyssinia Travel offers competitive flight tickets to Addis Ababa and other Ethiopian cities, visa assistance, and cargo/shipping services to Ethiopia. We are your one-stop shop for all travel and logistics needs between the Gulf and Ethiopia.',
      phone: '+971503456789',
      email: 'info@abyssinia-travel.ae',
      whatsapp: '+971503456789',
      country: 'UAE',
      city: 'Sharjah',
      address: 'Al Nabba, King Faisal Street',
      businessHours: {
        mon: { open: '09:00', close: '20:00' },
        tue: { open: '09:00', close: '20:00' },
        wed: { open: '09:00', close: '20:00' },
        thu: { open: '09:00', close: '20:00' },
        fri: { open: '14:00', close: '20:00' },
        sat: { open: '09:00', close: '20:00' },
        sun: { open: '09:00', close: '20:00' },
      },
    },
    categorySlugs: [
      { slug: 'travel-agency', isPrimary: true },
      { slug: 'cargo-shipping', isPrimary: false },
    ],
    packages: [
      { name: 'Flight Booking', description: 'Return flight to Addis Ababa', price: 1200, currency: 'AED', features: ['Best fare guarantee', 'Flexible dates', 'Baggage assistance', '24/7 support'] },
      { name: 'Cargo (Small)', description: 'Ship up to 30kg to Ethiopia', price: 250, currency: 'AED', features: ['Door-to-door delivery', 'Tracking', 'Insurance included', '7-14 day delivery'] },
      { name: 'Cargo (Full Container)', description: 'Full container shipping', price: 5000, currency: 'AED', features: ['20ft container', 'Customs clearance', 'Door-to-door', 'Insurance'] },
    ],
    faqs: [
      { question: 'How long does cargo take to arrive?', answer: 'Air cargo takes 3-5 days, sea cargo takes 3-4 weeks to Addis Ababa.' },
      { question: 'Do you handle visa applications?', answer: 'Yes, we assist with Ethiopian visa renewals, travel permits, and document attestation.' },
    ],
  },
  {
    tenantName: 'Selam PRO Services',
    tenantSlug: 'selam-pro',
    ownerEmail: 'owner@selam-pro.local',
    ownerFirst: 'Yonas',
    ownerLast: 'Haile',
    profile: {
      bio: 'PRO services, translation, and legal assistance for Ethiopians in Abu Dhabi',
      description: 'Selam PRO Services provides government transaction assistance (PRO services), Amharic-Arabic-English translation, document attestation, labor contract guidance, and legal consultation. We help Ethiopian workers and business owners navigate the UAE system.',
      phone: '+971504567890',
      email: 'info@selam-pro.ae',
      whatsapp: '+971504567890',
      country: 'UAE',
      city: 'Abu Dhabi',
      address: 'Electra Street, Tourist Club Area',
      businessHours: {
        mon: { open: '08:00', close: '18:00' },
        tue: { open: '08:00', close: '18:00' },
        wed: { open: '08:00', close: '18:00' },
        thu: { open: '08:00', close: '18:00' },
        fri: { open: '08:00', close: '12:00' },
        sat: { open: '09:00', close: '14:00' },
      },
    },
    categorySlugs: [
      { slug: 'pro-typing', isPrimary: true },
      { slug: 'translation', isPrimary: false },
      { slug: 'legal-labor', isPrimary: false },
    ],
    packages: [
      { name: 'Document Translation', description: 'Per document translation', price: 100, currency: 'AED', features: ['Amharic ↔ Arabic', 'Amharic ↔ English', 'Certified translation', '24h turnaround'] },
      { name: 'PRO Package', description: 'Government transaction assistance', price: 200, currency: 'AED', features: ['Visa applications', 'Emirates ID', 'License renewal', 'Labor card'] },
      { name: 'Legal Consultation', description: 'Labor law consultation', price: 350, currency: 'AED', features: ['1-hour consultation', 'Contract review', 'Rights explanation', 'Follow-up support'] },
    ],
    faqs: [
      { question: 'What languages do you translate?', answer: 'We offer certified translation between Amharic, Arabic, and English for all official documents.' },
      { question: 'Can you help with labor disputes?', answer: 'Yes, we provide guidance on labor rights, contract issues, and can refer you to licensed lawyers for court cases.' },
    ],
  },
  {
    tenantName: 'Addis Auto Care',
    tenantSlug: 'addis-auto-care',
    ownerEmail: 'owner@addis-auto.local',
    ownerFirst: 'Bereket',
    ownerLast: 'Alemu',
    profile: {
      bio: 'Ethiopian-owned auto repair and car wash in Al Quoz, Dubai',
      description: 'Addis Auto Care offers affordable and reliable car repair, maintenance, and detailing services. Our experienced Ethiopian mechanics specialize in all makes and models. We also provide a full car wash and detailing service.',
      phone: '+971505678901',
      email: 'info@addis-auto.ae',
      whatsapp: '+971505678901',
      country: 'UAE',
      city: 'Dubai',
      address: 'Al Quoz Industrial Area 3',
      businessHours: {
        mon: { open: '07:00', close: '20:00' },
        tue: { open: '07:00', close: '20:00' },
        wed: { open: '07:00', close: '20:00' },
        thu: { open: '07:00', close: '20:00' },
        fri: { open: '14:00', close: '20:00' },
        sat: { open: '07:00', close: '20:00' },
        sun: { open: '07:00', close: '20:00' },
      },
    },
    categorySlugs: [
      { slug: 'mechanic-garage', isPrimary: true },
      { slug: 'car-wash', isPrimary: false },
    ],
    packages: [
      { name: 'Basic Service', description: 'Oil change and inspection', price: 150, currency: 'AED', features: ['Oil & filter change', 'Multi-point inspection', 'Tire pressure check', 'Fluid top-up'] },
      { name: 'Full Service', description: 'Complete car maintenance', price: 450, currency: 'AED', features: ['Oil change', 'Brake inspection', 'AC check', 'Battery test', 'All fluids'] },
      { name: 'Car Wash & Detail', description: 'Interior and exterior detailing', price: 100, currency: 'AED', features: ['Exterior wash', 'Interior vacuum', 'Dashboard polish', 'Tire shine'] },
    ],
    faqs: [
      { question: 'Do you work on all car brands?', answer: 'Yes, our mechanics have experience with Japanese, Korean, European, and American vehicles.' },
      { question: 'Do you offer pickup service?', answer: 'Yes, we offer free pickup and delivery within Dubai for full service packages.' },
    ],
  },
];

async function seedDemoBusinesses() {
  const hashedPassword = await hashPassword('demo123');
  const starterPlan = await prisma.subscriptionPlan.findUnique({ where: { name: 'starter' } });

  for (const biz of DEMO_BUSINESSES) {
    // Create tenant
    const tenant = await prisma.tenant.upsert({
      where: { slug: biz.tenantSlug },
      update: {},
      create: {
        name: biz.tenantName,
        slug: biz.tenantSlug,
        status: 'ACTIVE',
        settings: JSON.stringify({
          timezone: 'Asia/Dubai',
          currency: 'AED',
        }),
      },
    });

    // Create owner user
    await prisma.tenantUser.upsert({
      where: { tenantId_email: { tenantId: tenant.id, email: biz.ownerEmail } },
      update: { passwordHash: hashedPassword },
      create: {
        tenantId: tenant.id,
        email: biz.ownerEmail,
        passwordHash: hashedPassword,
        firstName: biz.ownerFirst,
        lastName: biz.ownerLast,
        role: 'OWNER',
        isActive: true,
        emailVerified: true,
      },
    });

    // Create default roles
    await seedDefaultRolesForTenant(tenant.id);

    // Assign subscription
    if (starterPlan) {
      await prisma.tenantSubscription.upsert({
        where: { tenantId: tenant.id },
        update: {},
        create: {
          tenantId: tenant.id,
          planId: starterPlan.id,
          status: 'ACTIVE',
          startedAt: new Date(),
          renewsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    }

    // Create provider profile
    const profile = await prisma.providerProfile.upsert({
      where: { tenantId: tenant.id },
      update: {
        bio: biz.profile.bio,
        description: biz.profile.description,
        phone: biz.profile.phone,
        email: biz.profile.email,
        whatsapp: biz.profile.whatsapp,
        instagram: biz.profile.instagram,
        country: biz.profile.country,
        city: biz.profile.city,
        address: biz.profile.address,
        businessHours: biz.profile.businessHours as any,
      },
      create: {
        tenantId: tenant.id,
        bio: biz.profile.bio,
        description: biz.profile.description,
        phone: biz.profile.phone,
        email: biz.profile.email,
        whatsapp: biz.profile.whatsapp,
        instagram: biz.profile.instagram,
        country: biz.profile.country,
        city: biz.profile.city,
        address: biz.profile.address,
        businessHours: biz.profile.businessHours as any,
      },
    });

    // Assign categories
    for (const catDef of biz.categorySlugs) {
      const category = await prisma.category.findUnique({ where: { slug: catDef.slug } });
      if (category) {
        await prisma.providerCategory.upsert({
          where: {
            providerProfileId_categoryId: {
              providerProfileId: profile.id,
              categoryId: category.id,
            },
          },
          update: { isPrimary: catDef.isPrimary },
          create: {
            providerProfileId: profile.id,
            categoryId: category.id,
            isPrimary: catDef.isPrimary,
          },
        });
      }
    }

    // Create packages
    for (let i = 0; i < biz.packages.length; i++) {
      const pkg = biz.packages[i];
      const existingPkg = await prisma.providerPackage.findFirst({
        where: { providerProfileId: profile.id, name: pkg.name },
      });
      if (!existingPkg) {
        await prisma.providerPackage.create({
          data: {
            providerProfileId: profile.id,
            name: pkg.name,
            description: pkg.description,
            price: pkg.price,
            currency: pkg.currency,
            features: pkg.features,
            sortOrder: i,
          },
        });
      }
    }

    // Create FAQs
    for (let i = 0; i < biz.faqs.length; i++) {
      const faq = biz.faqs[i];
      const existingFaq = await prisma.providerFaq.findFirst({
        where: { providerProfileId: profile.id, question: faq.question },
      });
      if (!existingFaq) {
        await prisma.providerFaq.create({
          data: {
            providerProfileId: profile.id,
            question: faq.question,
            answer: faq.answer,
            sortOrder: i,
          },
        });
      }
    }
  }

  console.log('  ✓ Demo businesses seeded (5 Ethiopian businesses across UAE)');
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
        timezone: 'Asia/Dubai',
        currency: 'AED',
      }),
    },
  });

  const ownerEmail = 'owner@demo.directory-saas.local';
  const hashedDemo = await hashPassword('demo123');
  await prisma.tenantUser.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: ownerEmail } },
    update: { passwordHash: hashedDemo },
    create: {
      tenantId: tenant.id,
      email: ownerEmail,
      passwordHash: hashedDemo,
      firstName: 'Demo',
      lastName: 'Owner',
      role: 'OWNER',
      isActive: true,
      emailVerified: true,
    },
  });

  await seedDefaultRolesForTenant(tenant.id);

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
        renewsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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
  await seedCategories();
  await seedDemoBusinesses();
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
