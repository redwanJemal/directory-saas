# Task 15: File Storage — MinIO/S3, Tenant-Scoped

## Summary
Implement tenant-scoped file storage using MinIO (S3-compatible) with presigned URLs, upload validation, and automatic bucket organization.

## Current State
- S3/MinIO configured in environment (Task 03).
- Tenant context available (Task 07).

## Required Changes

### 15.1 Storage Service

**File**: `backend/src/common/services/storage.service.ts`

```typescript
@Injectable()
export class StorageService {
  // Upload file with tenant-scoped path
  async upload(tenantId: string, folder: string, file: Express.Multer.File): Promise<{ key: string; url: string }>;

  // Get presigned URL (read, 1h expiry)
  async getPresignedUrl(key: string, expirySeconds?: number): Promise<string>;

  // Get presigned upload URL (for direct client upload)
  async getUploadUrl(tenantId: string, folder: string, filename: string, contentType: string): Promise<{ uploadUrl: string; key: string }>;

  // Delete file
  async delete(key: string): Promise<void>;

  // Delete all files for a tenant
  async deleteTenantFiles(tenantId: string): Promise<void>;
}
```

**Key format**: `{tenantId}/{folder}/{uuid}-{originalName}`

### 15.2 Upload Controller

**File**: `backend/src/modules/uploads/uploads.controller.ts`

- `POST /api/v1/uploads` — Upload file (multipart)
- `POST /api/v1/uploads/presigned` — Get presigned upload URL
- `DELETE /api/v1/uploads/:key` — Delete file

### 15.3 Upload Validation

- Max file size: 10MB (configurable per plan)
- Allowed MIME types: images (jpg, png, webp), PDF, documents
- Reject executable files, scripts
- Validate MIME type matches file extension (not just Content-Type header)

### 15.4 Tests

- Test: Upload stores file with correct tenant-scoped key
- Test: Presigned URL is valid and accessible
- Test: File size limit enforced
- Test: Invalid MIME type rejected
- Test: Delete removes file from storage
- Test: Tenant A cannot access tenant B's files

## Acceptance Criteria

1. Tenant-scoped file storage with MinIO
2. Direct upload and presigned URL upload
3. File size and MIME type validation
4. Presigned read URLs (1h default expiry)
5. Tenant isolation in storage paths
6. All tests pass
