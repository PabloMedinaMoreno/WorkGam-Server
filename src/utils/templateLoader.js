import fs from 'fs';
import path from 'path';

/**
 * Loads an HTML template and replaces the placeholders with the provided values.
 *
 * @param {string} templateName - The name of the template file (e.g., 'resetPasswordEmail.html').
 * @param {Object} replacements - An object containing placeholder keys and values to replace in the template.
 * @returns {string} The HTML content with the placeholders replaced.
 */
export function loadTemplate(templateName, replacements) {
  const templatePath = path.join(
    process.cwd(),
    'src',
    'templates',
    templateName,
  );
  let template = fs.readFileSync(templatePath, 'utf-8');

  // Replace each placeholder (e.g., {{RESET_LINK}})
  for (const [key, value] of Object.entries(replacements)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    template = template.replace(regex, value);
  }
  return template;
}
