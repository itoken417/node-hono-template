import crypto from 'crypto';

// サンプル用のインメモリストア（本番ではDBに保存すること）
const keyStore = new Map<string, { createdAt: Date; label: string }>();

export function generateApiKey(): string {
    return crypto.randomBytes(32).toString('hex');
}

export function issueApiKey(label: string): string {
    const key = generateApiKey();
    keyStore.set(key, { createdAt: new Date(), label });
    return key;
}

export function validateApiKey(key: string): boolean {
    return keyStore.has(key);
}

export function getApiKeyInfo(key: string) {
    return keyStore.get(key) ?? null;
}
