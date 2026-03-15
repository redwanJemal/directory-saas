import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import { AppConfigService } from '../../config/app-config.service';
import { JobService } from './job.service';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
  }),
}));

const mockConfig = {
  smtp: { host: 'localhost', port: 1025, user: '', pass: '', from: 'test@example.com' },
  appName: 'TestApp',
  isProduction: false,
};

describe('EmailService', () => {
  let service: EmailService;
  let jobServiceMock: Record<string, jest.Mock>;

  beforeEach(async () => {
    jobServiceMock = {
      add: jest.fn().mockResolvedValue({ id: 'job-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: AppConfigService, useValue: mockConfig },
        { provide: JobService, useValue: jobServiceMock },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  describe('send', () => {
    it('should queue email via BullMQ', async () => {
      await service.send('user@example.com', 'welcome', {
        firstName: 'John',
        loginUrl: 'https://example.com/login',
      });

      expect(jobServiceMock.add).toHaveBeenCalledWith(
        'email',
        'send-welcome',
        {
          to: 'user@example.com',
          template: 'welcome',
          data: { firstName: 'John', loginUrl: 'https://example.com/login' },
        },
      );
    });
  });

  describe('sendBulk', () => {
    it('should queue multiple emails', async () => {
      await service.sendBulk([
        { to: 'a@example.com', template: 'welcome', data: { firstName: 'A' } },
        { to: 'b@example.com', template: 'welcome', data: { firstName: 'B' } },
      ]);

      expect(jobServiceMock.add).toHaveBeenCalledTimes(2);
    });
  });

  describe('renderTemplate', () => {
    it('should substitute variables in template', () => {
      const html = service.renderTemplate('welcome', {
        firstName: 'Jane',
        loginUrl: 'https://example.com',
      });

      expect(html).toContain('Jane');
      expect(html).toContain('https://example.com');
      expect(html).toContain('TestApp');
      expect(html).not.toContain('{{firstName}}');
      expect(html).not.toContain('{{loginUrl}}');
    });

    it('should substitute variables in password-reset template', () => {
      const html = service.renderTemplate('password-reset', {
        firstName: 'Bob',
        resetUrl: 'https://example.com/reset',
        expiresIn: '1 hour',
      });

      expect(html).toContain('Bob');
      expect(html).toContain('https://example.com/reset');
      expect(html).toContain('1 hour');
    });

    it('should substitute variables in tenant-invite template', () => {
      const html = service.renderTemplate('tenant-invite', {
        recipientName: 'Alice',
        inviterName: 'Bob',
        tenantName: 'Acme Corp',
        role: 'Admin',
        inviteUrl: 'https://example.com/invite',
        expiresIn: '7 days',
      });

      expect(html).toContain('Alice');
      expect(html).toContain('Bob');
      expect(html).toContain('Acme Corp');
      expect(html).toContain('Admin');
    });

    it('should substitute variables in plan-upgrade template', () => {
      const html = service.renderTemplate('plan-upgrade', {
        firstName: 'Charlie',
        planName: 'Enterprise',
        dashboardUrl: 'https://example.com/dashboard',
      });

      expect(html).toContain('Charlie');
      expect(html).toContain('Enterprise');
    });
  });

  describe('sendDirect', () => {
    it('should send email directly via SMTP', async () => {
      const nodemailer = require('nodemailer');
      const sendMail = nodemailer.createTransport().sendMail;

      await service.sendDirect('user@example.com', 'welcome', {
        firstName: 'John',
        loginUrl: 'https://example.com',
      });

      expect(sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'test@example.com',
          to: 'user@example.com',
          subject: expect.stringContaining('Welcome'),
          html: expect.stringContaining('John'),
        }),
      );
    });
  });
});
