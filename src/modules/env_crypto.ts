import crypto from 'crypto'

const ALGO = 'aes-256-gcm'
export const ENC_PREFIX = 'enc:'

function getKey(): Buffer {
    const keyStr = process.env.APP_ENV_KEY
    if (!keyStr) throw new Error('APP_ENV_KEY が設定されていません（.env.key を確認してください）')
    const key = Buffer.from(keyStr, 'base64')
    if (key.length < 32) throw new Error('APP_ENV_KEY が短すぎます（32 バイト以上必要）')
    return key.subarray(0, 32)
}

export function encryptValue(plaintext: string): string {
    const key = getKey()
    const iv = crypto.randomBytes(12)
    const cipher = crypto.createCipheriv(ALGO, key, iv)
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
    const tag = cipher.getAuthTag()
    return ENC_PREFIX + Buffer.concat([iv, tag, encrypted]).toString('base64')
}

export function decryptValue(ciphertext: string): string {
    const key = getKey()
    const data = Buffer.from(ciphertext.slice(ENC_PREFIX.length), 'base64')
    const iv = data.subarray(0, 12)
    const tag = data.subarray(12, 28)
    const encrypted = data.subarray(28)
    const decipher = crypto.createDecipheriv(ALGO, key, iv)
    decipher.setAuthTag(tag)
    return decipher.update(encrypted).toString('utf8') + decipher.final('utf8')
}

// process.env 内の enc: 値をすべて復号して上書きする
export function decryptEnv(): void {
    for (const [key, value] of Object.entries(process.env)) {
        if (value?.startsWith(ENC_PREFIX)) {
            try {
                process.env[key] = decryptValue(value)
            } catch (e) {
                throw new Error(`環境変数 ${key} の復号に失敗しました: ${(e as Error).message}`)
            }
        }
    }
}
