import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

/**
 * Generates a string of secure random digits of a specified length.
 * @param {number} length - The number of digits to generate.
 * @returns {string} - The randomly generated digits as a string.
 */
function generateSecureDigits(length) {
  let result = '';
  for (let i = 0; i < length; i++) {
    // Generates a random integer between 0 (inclusive) and 10 (exclusive)
    result += crypto.randomInt(0, 10).toString();
  }
  return result;
}

// Generate the required codes
const registrationCode = generateSecureDigits(10);
const loginCode = generateSecureDigits(6);

// Format the output for a .env file
const envContent = `\n# Admin Generated Codes\nADMIN_REGISTRATION_CODE=${registrationCode}\nADMIN_LOGIN_CODE=${loginCode}\n`;

console.log('✅ Secure codes generated successfully!\n');
console.log('--- Copy and paste this into your .env file ---');
console.log(`ADMIN_REGISTRATION_PASSWORD=${registrationCode}`);
console.log(`ADMIN_LOGIN_CODE=${loginCode}`);
console.log('-----------------------------------------------');

// OPTIONAL: Uncomment the lines below if you want the script to automatically 
// append these codes to a .env file in the same directory.

/*
// import.meta.dirname is the modern ES module equivalent to __dirname (available in Node v20.11+)
const envFilePath = path.join(import.meta.dirname, '.env');
try {
  fs.appendFileSync(envFilePath, envContent, { encoding: 'utf8' });
  console.log('\nCodes were automatically appended to your .env file.');
} catch (error) {
  console.error('\nError writing to .env file:', error.message);
}
*/