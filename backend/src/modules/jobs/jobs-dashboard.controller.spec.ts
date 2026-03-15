import { Test, TestingModule } from '@nestjs/testing';
import { JobsDashboardController } from './jobs-dashboard.controller';
import { JobService } from '../../common/services/job.service';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

// Mock bull-board
jest.mock('@bull-board/api', () => ({
  createBullBoard: jest.fn(),
}));

jest.mock('@bull-board/api/bullMQAdapter', () => ({
  BullMQAdapter: jest.fn().mockImplementation((queue) => ({ queue })),
}));

const mockGetRouter = jest.fn().mockReturnValue(jest.fn());

jest.mock('@bull-board/express', () => ({
  ExpressAdapter: jest.fn().mockImplementation(() => ({
    setBasePath: jest.fn(),
    getRouter: mockGetRouter,
  })),
}));

describe('JobsDashboardController', () => {
  let controller: JobsDashboardController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const mockJobService = {
      getAllQueues: jest.fn().mockReturnValue([
        { name: 'email' },
        { name: 'notification' },
      ]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobsDashboardController],
      providers: [
        { provide: JobService, useValue: mockJobService },
        { provide: Reflector, useValue: new Reflector() },
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<JobsDashboardController>(JobsDashboardController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create bull board with all queues', () => {
    const { createBullBoard } = require('@bull-board/api');
    expect(createBullBoard).toHaveBeenCalledWith(
      expect.objectContaining({
        queues: expect.any(Array),
      }),
    );
  });

  it('should set base path to /api/v1/admin/queues', () => {
    const { ExpressAdapter } = require('@bull-board/express');
    const instance = ExpressAdapter.mock.results[0].value;
    expect(instance.setBasePath).toHaveBeenCalledWith('/api/v1/admin/queues');
  });

  it('should delegate handleAll to express adapter router', () => {
    const mockReq = {} as any;
    const mockRes = {} as any;
    const routerFn = jest.fn();
    mockGetRouter.mockReturnValue(routerFn);

    controller.handleAll(mockReq, mockRes);
    expect(routerFn).toHaveBeenCalledWith(mockReq, mockRes);
  });

  it('should delegate handleRoot to express adapter router', () => {
    const mockReq = {} as any;
    const mockRes = {} as any;
    const routerFn = jest.fn();
    mockGetRouter.mockReturnValue(routerFn);

    controller.handleRoot(mockReq, mockRes);
    expect(routerFn).toHaveBeenCalledWith(mockReq, mockRes);
  });
});
