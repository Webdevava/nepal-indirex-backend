import nodemailer from 'nodemailer';
import { logger } from './logger';
import { compile } from 'handlebars';
import { readFileSync } from 'fs';
import { join } from 'path';
import { AppError } from '../middleware/errorHandler';

export interface EmailOptions {
  to: string;
  name: string;
  password: string;
  frontendUrl: string;
}

export const sendInviteEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const templateSource = readFileSync(join(__dirname, '../templates/invite-user.hbs'), 'utf8');
    const template = compile(templateSource);
    const html = template({
      name: options.name,
      email: options.to,
      password: options.password,
      frontendUrl: options.frontendUrl,
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: options.to,
      subject: 'Welcome to Our Platform - Your Account Details',
      html,
    });

    logger.info(`Invite email sent to ${options.to}`);
  } catch (error) {
    logger.error('Failed to send invite email:', error);
    throw new AppError('Failed to send invite email', 500);
  }
};