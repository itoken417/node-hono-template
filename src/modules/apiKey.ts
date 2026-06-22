import crypto from 'crypto';

// サンプル用のインメモリストア（本番ではDBに保存すること）
const API_KEY_TTL_SECONDS = 3600; // 1時間

type KeyEntry = { createdAt: Date; expiresAt: Date; label: string };
const keyStore = new Map<string, KeyEntry>();

export function generateApiKey(): string {
    return crypto.randomBytes(32).toString('hex');
}

export function issueApiKey(label: string): string {
    const key = generateApiKey();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + API_KEY_TTL_SECONDS * 1000);
    keyStore.set(key, { createdAt: now, expiresAt, label });
    return key;
}

export function validateApiKey(key: string): boolean {
    const entry = keyStore.get(key);
    if (!entry) return false;
    if (entry.expiresAt < new Date()) {
        keyStore.delete(key);
        return false;
    }
    return true;
}

export function revokeApiKey(key: string): void {
    keyStore.delete(key);
}

export function getApiKeyInfo(key: string) {
    return keyStore.get(key) ?? null;
}

export function cleanupExpiredKeys(): void {
    const now = new Date();
    for (const [key, entry] of keyStore) {
        if (entry.expiresAt < now) keyStore.delete(key);
    }
}

setInterval(cleanupExpiredKeys, 10 * 60 * 1000); // 10分ごとに期限切れキーを削除
