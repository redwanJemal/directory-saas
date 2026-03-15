import { AuditController, AdminAuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { ServiceResult } from '../../common/types';
import { PaginatedResult } from '../../common/dto/pagination.dto';

function createMockService(): jest.Mocked<AuditService> {
  return {
    log: jest.fn(),
    findAll: jest.fn(),
    findAllAdmin: jest.fn(),
  } as any;
}

describe('AuditController', () => {
  let controller: AuditController;
  let service: jest.Mocked<AuditService>;

  beforeEach(() => {
    service = createMockService();
    controller = new AuditController(service);
  });

  describe('findAll', () => {
    it('should return paginated audit logs for a tenant', async () => {
      const mockData = new PaginatedResult(
        [{ id: 'log-1', action: 'CREATE', entity: 'users' }],
        1,
        1,
        20,
      );
      service.findAll.mockResolvedValue(ServiceResult.ok(mockData));

      const query = { filters: [], sort: [], page: 1, pageSize: 20, include: [] };
      const result = await controller.findAll('tenant-1', query);

      expect(result).toEqual(mockData);
      expect(service.findAll).toHaveBeenCalledWith('tenant-1', query);
    });

    it('should throw when service returns failure', async () => {
      service.findAll.mockResolvedValue(
        ServiceResult.fail('INTERNAL_ERROR', 'Something went wrong'),
      );

      const query = { filters: [], sort: [], page: 1, pageSize: 20, include: [] };
      await expect(controller.findAll('tenant-1', query)).rejects.toThrow();
    });
  });
});

describe('AdminAuditController', () => {
  let controller: AdminAuditController;
  let service: jest.Mocked<AuditService>;

  beforeEach(() => {
    service = createMockService();
    controller = new AdminAuditController(service);
  });

  describe('findAll', () => {
    it('should return paginated audit logs for admin', async () => {
      const mockData = new PaginatedResult(
        [{ id: 'log-1', action: 'UPDATE', entity: 'tenants' }],
        1,
        1,
        20,
      );
      service.findAllAdmin.mockResolvedValue(ServiceResult.ok(mockData));

      const query = { filters: [], sort: [], page: 1, pageSize: 20, include: [] };
      const result = await controller.findAll(query);

      expect(result).toEqual(mockData);
      expect(service.findAllAdmin).toHaveBeenCalledWith(query);
    });
  });
});
