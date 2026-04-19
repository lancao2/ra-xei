import crypto from 'crypto';

// Em produção, estas chaves devem vir de variáveis de ambiente (.env)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'fac66a3e1c667a7e182312d8a4f66dd264858b97b0a399478f78d6b9d6a3f4e1'; // 32 bytes (64 caracteres hex)
const IV_LENGTH = 16; // Para AES, o IV tem sempre 16 bytes

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (e) {
    console.error('Decryption failed:', e);
    return 'ERRO_DESCRIPTOGRAFIA';
  }
}

export function computeHash(text: string): string {
  // Hash determinístico para buscas e login
  return crypto.createHash('sha256').update(text + 'ra-xei-salt').digest('hex');
}

// Re-usando o hash de PIN para consistência
export function hashPin(pin: string): string {
    return crypto.pbkdf2Sync(pin, 'salt-do-ra-xei', 1000, 64, 'sha512').toString('hex');
}
