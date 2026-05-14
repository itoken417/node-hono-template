import { createTransport } from 'nodemailer';
import { config } from 'dotenv';
import crypto from 'crypto';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

// .env.key → .env の順に読み込み
const keyPath = path.resolve(__dirname, '../.env.key');
const envPath = path.resolve(__dirname, '../.env');

if (existsSync(keyPath)) config({ path: keyPath });
if (!existsSync(envPath)) {
    console.error('.env が見つかりません。01_create_env.js を先に実行してください。');
    process.exit(1);
}
config({ path: envPath });

// enc: 値を復号
const ENC_PREFIX = 'enc:';
function decrypt(ciphertext) {
    const keyStr = process.env.APP_ENV_KEY;
    if (!keyStr) throw new Error('APP_ENV_KEY が設定されていません（.env.key を確認してください）');
    const key  = Buffer.from(keyStr, 'base64').subarray(0, 32);
    const data = Buffer.from(ciphertext.slice(ENC_PREFIX.length), 'base64');
    const iv   = data.subarray(0, 12);
    const tag  = data.subarray(12, 28);
    const enc  = data.subarray(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return decipher.update(enc).toString('utf8') + decipher.final('utf8');
}
for (const [k, v] of Object.entries(process.env)) {
    if (v?.startsWith(ENC_PREFIX)) process.env[k] = decrypt(v);
}

// SMTP 設定の確認
const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASSWORD, SYSTEM_MAIL } = process.env;

console.log('=== メールサーバー接続テスト ===');
console.log('');
console.log('SMTP 設定:');
console.log(`  HOST   : ${SMTP_HOST || '(未設定)'}`);
console.log(`  PORT   : ${SMTP_PORT || '(未設定)'}`);
console.log(`  SECURE : ${SMTP_SECURE || '(未設定)'}`);
console.log(`  USER   : ${SMTP_USER || '(未設定)'}`);
console.log(`  PASS   : ${SMTP_PASSWORD ? '********' : '(未設定)'}`);
console.log('');

if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
    console.error('SMTP_HOST / SMTP_USER / SMTP_PASSWORD が設定されていません。');
    console.error('01_create_env.js を再実行して設定してください。');
    rl.close();
    process.exit(1);
}

const transporter = createTransport({
    host:   SMTP_HOST,
    port:   Number(SMTP_PORT ?? 587),
    secure: SMTP_SECURE === 'true',
    auth:   { user: SMTP_USER, pass: SMTP_PASSWORD },
});

// 接続確認
process.stdout.write('接続確認中... ');
try {
    await transporter.verify();
    console.log('OK');
} catch (err) {
    console.log('失敗');
    console.error(`エラー: ${err.message}`);
    rl.close();
    process.exit(1);
}

// テストメール送信の確認
const to = await ask(`テストメールの送信先 (default: ${SYSTEM_MAIL || ''}): `);
const toAddr = to.trim() || SYSTEM_MAIL;

if (!toAddr) {
    console.log('送信先が未入力のため送信をスキップします。');
    rl.close();
    process.exit(0);
}

rl.close();

process.stdout.write(`${toAddr} へ送信中... `);
try {
    await transporter.sendMail({
        from:    SYSTEM_MAIL || SMTP_USER,
        to:      toAddr,
        subject: '[テスト] メールサーバー接続確認',
        text:    'このメールはセットアップスクリプトによる接続テストです。',
    });
    console.log('送信完了');
} catch (err) {
    console.log('失敗');
    console.error(`エラー: ${err.message}`);
    process.exit(1);
}
