export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE';

export interface AuditLogEntry {
  tenantId?: string;
  userId?: string;
  userType?: string;
  action: AuditAction;
  entity: string;
  entityId?: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}
