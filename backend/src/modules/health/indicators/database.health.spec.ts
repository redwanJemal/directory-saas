import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckError } from '@nestjs/terminus';
import { DatabaseHealthIndicator } from './database.health';
import { PrismaService } from '../../../prisma/prisma.service';

describe('DatabaseHealthIndicator', () => {
  let indicator: DatabaseHealthIndicator;
  let prisma: { $queryRaw: jest.Mock };

  beforeEach(async () => {
    prisma = { $queryRaw: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatabaseHealthIndicator,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    indicator = module.get<DatabaseHealthIndicator>(DatabaseHealthIndicator);
  });

  it('should return up when database responds', async () => {
    prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

    const result = await indicator.pingCheck('database');

    expect(result).toEqual({ database: { status: 'up' } });
  });

  it('should throw HealthCheckError when database is down', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('Connection refused'));

    await expect(indicator.pingCheck('database')).rejects.toThrow(
      HealthCheckError,
    );
  });
});
