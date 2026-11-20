const crypto = require('crypto');

// Прописываем ключи напрямую, чтобы не зависеть от файла .env
process.env.ENCRYPTION_KEY = 'f4c8e1b49d5c75bbc6a053e3f74e02a3f4c8e1b49d5c75bbc6a053e3f74e02a3';
process.env.TELEGRAM_TOKEN = '8690555890:AAFCsBWm-oDfwp_mBJFIbvqNbiG5nK-bXJU';
process.env.ADMIN_CHAT_ID = '8749704855';

module.exports = {
  encryptData: (data, key) => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(JSON.stringify(data));
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return Buffer.concat([iv, encrypted]).toString('base64');
  },

  decryptData: (data, key) => {
    const buffer = Buffer.from(data, 'base64');
    const iv = buffer.slice(0, 16);
    const encrypted = buffer.slice(16);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return JSON.parse(decrypted.toString());
  },

  validateEnv: () => {
    const required = ['TELEGRAM_TOKEN', 'ADMIN_CHAT_ID', 'ENCRYPTION_KEY'];
    for (const key of required) {
      if (!process.env[key]) {
        throw new Error(`Missing required environment variable: ${key}`);
      }
    }
    
    // Проверка на 64 символа (наш ключ теперь ровно 64)
    if (process.env.ENCRYPTION_KEY.length !== 64) {
      throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
    }
  },

  generateKey: () => {
    return crypto.randomBytes(32).toString('hex');
  }
};