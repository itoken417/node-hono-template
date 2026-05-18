import crypto from 'crypto';
import { promisify } from 'util';
import dotenv from 'dotenv';

dotenv.config();

const scrypt = promisify(crypto.scrypt);

const getPepper = (): string => {
    const pepper = process.env.APP_PEPPER;
    if (!pepper) throw new Error('APP_PEPPER が .env に設定されていません');
    return pepper;
};

const applyPepper = (password: string): string => `${getPepper()}:${password}`;

export async function hashPassword(password: string): Promise<{ salt: string; hash: string }> {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = (await scrypt(applyPepper(password), salt, 64)) as Buffer;
    return { salt, hash: hash.toString('hex') };
}

// ユーザー不在時にも scrypt を必ず実行してタイミング差をなくすためのダミー値
export const DUMMY_SALT = '0'.repeat(32);
export const DUMMY_HASH = '0'.repeat(128);

export async function verifyPassword(password: string, storedHash: string, salt: string): Promise<boolean> {
    if (!salt || !storedHash) return false;
    const hash = (await scrypt(applyPepper(password), salt, 64)) as Buffer;
    const storedHashBuffer = Buffer.from(storedHash, 'hex');
    if (hash.length !== storedHashBuffer.length) return false;
    return crypto.timingSafeEqual(hash, storedHashBuffer);
}

export function hashEmail(email: string): string {
    const pepper = process.env.APP_PEPPER;
    if (!pepper) throw new Error('APP_PEPPER が .env に設定されていません');
    return crypto.createHmac('sha256', pepper).update(email.toLowerCase()).digest('hex');
}

export function generateVerifyCode(): string {
    return String(crypto.randomInt(100000, 999999));
}

export function generateFormToken(): string {
    return crypto.randomBytes(32).toString('hex')
}
