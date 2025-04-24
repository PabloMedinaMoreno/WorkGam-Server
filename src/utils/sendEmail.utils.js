import nodemailer from 'nodemailer';
import { EMAIL_FROM, EMAIL_PASS, NODE_ENV } from '../constants/constants.js';

/**
 * Sends an email using the provided parameters.
 *
 * @param {string} to - The recipient's email address.
 * @param {string} subject - The email subject line.
 * @param {string} html - The HTML content of the email.
 * @returns {Promise<void>} A Promise that resolves when the email is sent.
 * @throws {Error} If sending the email fails.
 */
export async function sendEmail(to, subject, html) {

  // Check if the environment is production
  if (NODE_ENV === 'test') return;
  // Create the transporter using your email service configuration
  const transporter = nodemailer.createTransport({
    service: 'Gmail', // or another email service provider
    auth: {
      user: EMAIL_FROM,
      pass: EMAIL_PASS,
    },
  });

  // Send the email
  await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject,
    html,
  });
}
