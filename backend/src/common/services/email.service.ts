import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { readFileSync } from 'fs';
import { join } from 'path';
import { AppConfigService } from '../../config/app-config.service';
import { JobService } from './job.service';
import { QUEUES } from '../constants/queues';

export interface EmailOptions {
  to: string;
  template: string;
  data: Record<string, string | number>;
  subject?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private readonly templateCache = new Map<string, string>();
  private readonly templatesDir = join(__dirname, 'email-templates');

  constructor(
    private readonly config: AppConfigService,
    private readonly jobService: JobService,
  ) {
    const { host, port, user, pass } = this.config.smtp;
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      ...(user && pass ? { auth: { user, pass } } : {}),
    });
  }

  async send(
    to: string,
    template: string,
    data: Record<string, string | number>,
  ): Promise<void> {
    await this.jobService.add(QUEUES.EMAIL, `send-${template}`, {
      to,
      template,
      data,
    });
    this.logger.log(`Email queued [template: ${template}, to: ${to}]`);
  }

  async sendBulk(
    recipients: Array<{
      to: string;
      template: string;
      data: Record<string, string | number>;
    }>,
  ): Promise<void> {
    const jobs = recipients.map((r) =>
      this.jobService.add(QUEUES.EMAIL, `send-${r.template}`, {
        to: r.to,
        template: r.template,
        data: r.data,
      }),
    );
    await Promise.all(jobs);
    this.logger.log(`Bulk email queued [count: ${recipients.length}]`);
  }

  async sendDirect(
    to: string,
    template: string,
    data: Record<string, string | number>,
  ): Promise<void> {
    const html = this.renderTemplate(template, data);
    const subject = this.getSubjectForTemplate(template, data);
    const { from } = this.config.smtp;

    await this.transporter.sendMail({
      from,
      to,
      subject,
      html,
    });

    this.logger.log(`Email sent [template: ${template}, to: ${to}]`);
  }

  renderTemplate(
    template: string,
    data: Record<string, string | number>,
  ): string {
    let html = this.loadTemplate(template);
    const allData: Record<string, string | number> = {
      appName: this.config.appName,
      year: new Date().getFullYear(),
      ...data,
    };

    for (const [key, value] of Object.entries(allData)) {
      html = html.replace(
        new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
        String(value),
      );
    }

    return html;
  }

  private loadTemplate(template: string): string {
    const cached = this.templateCache.get(template);
    if (cached) return cached;

    const filePath = join(this.templatesDir, `${template}.html`);
    const content = readFileSync(filePath, 'utf-8');

    if (this.config.isProduction) {
      this.templateCache.set(template, content);
    }

    return content;
  }

  private getSubjectForTemplate(
    template: string,
    data: Record<string, string | number>,
  ): string {
    const subjects: Record<string, string> = {
      welcome: `Welcome to ${data.appName || this.config.appName}!`,
      'password-reset': 'Reset Your Password',
      'tenant-invite': `You've been invited to join ${data.tenantName || 'a team'}`,
      'plan-upgrade': 'Your Plan Has Been Upgraded',
    };

    return subjects[template] || `Notification from ${this.config.appName}`;
  }
}
