/**
 * Ticket/Confirmation Number Generator
 * Generates unique, human-readable confirmation numbers for form submissions
 */

export type TicketType = 'APP' | 'REF' | 'DON' | 'INQ' | 'PAR' | 'MAI';

/**
 * Generate a confirmation number with format: {TYPE}-{YYYYMMDD}-{XXXX}
 * Examples: APP-20250802-A4B7, REF-20250802-C9D2, DON-20250802-E1F8
 */
export function generateTicketNumber(type: TicketType): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  
  // Generate 4-character alphanumeric code (excluding confusing chars like 0, O, 1, I)
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return `${type}-${dateStr}-${code}`;
}

/**
 * Life House contact information for customer service
 */
export const LIFE_HOUSE_CONTACT = {
  phone: '(555) 123-4567',
  email: 'support@lifehouse.org',
  address: '123 Hope Street, City, State 12345',
  businessHours: 'Monday-Friday 9AM-6PM EST',
  website: 'www.lifehouse.org'
};

/**
 * Generate a confirmation message with ticket number and contact info
 */
export function generateConfirmationMessage(
  ticketNumber: string, 
  formType: string,
  additionalInfo?: string
): string {
  return `
Thank you for your ${formType} submission!

Your confirmation number is: ${ticketNumber}

Please save this number for your records. If you need to follow up on your submission, reference this confirmation number when contacting us.

Life House Contact Information:
📞 Phone: ${LIFE_HOUSE_CONTACT.phone}
📧 Email: ${LIFE_HOUSE_CONTACT.email}
🕒 Hours: ${LIFE_HOUSE_CONTACT.businessHours}
🌐 Website: ${LIFE_HOUSE_CONTACT.website}

${additionalInfo || ''}

We appreciate your interest in Life House and will be in touch soon!
  `.trim();
}

/**
 * Get ticket type from form submission endpoint
 */
export function getTicketTypeFromEndpoint(endpoint: string): TicketType {
  if (endpoint.includes('apply')) return 'APP';
  if (endpoint.includes('refer')) return 'REF';  
  if (endpoint.includes('donate')) return 'DON';
  if (endpoint.includes('inquiry')) return 'INQ';
  if (endpoint.includes('partner')) return 'PAR';
  if (endpoint.includes('maintenance')) return 'MAI';
  return 'APP'; // Default fallback
}