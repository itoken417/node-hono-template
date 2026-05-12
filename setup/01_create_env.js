import fs from 'fs/promises';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const file = '../.env';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const askQuestion = (question) =>
    new Promise((resolve) => rl.question(question, resolve));

// デフォルトの設定値（必要に応じて調整）
const defaultConfig = {
    APP_NAME: 'MyApp',
    NODE_ENV: 'development',
    LOG_DIR: 'logs',
    SYSTEM_MAIL: '',
    ERROR_TO: '',
    SMTP_HOST: '',
    SMTP_PORT: '587',
    SMTP_SECURE: 'false',
    SMTP_USER: '',
    SMTP_PASSWORD: '',
    PG_HOST: 'localhost',
    PG_PORT: '5432',
    PG_USER: 'app',
    PG_PASSWORD: '',
    PG_DATABASE: 'database',
    SESSION_SECRET_KEY: '',
    APP_PEPPER: '',
};

// 既存の .env をパースして返す（存在しない場合は null）
async function loadExistingEnv(filepath) {
    try {
        const content = await fs.readFile(filepath, 'utf-8');
        const existing = {};
        for (const line of content.split('\n')) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const idx = trimmed.indexOf('=');
            if (idx === -1) continue;
            const key = trimmed.slice(0, idx).trim();
            const value = trimmed.slice(idx + 1);
            existing[key] = value;
        }
        return existing;
    } catch {
        return null;
    }
}

function generateSecret() {
    return crypto.randomBytes(32).toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

(async () => {
    console.log('=== .env File Generator ===');
    console.log('このスクリプトは、アプリケーションの環境変数を対話形式で入力し、');
    console.log('.env ファイルを生成します。');
    console.log('SESSION_SECRET_KEY / APP_PEPPER はランダム生成（yes）を推奨します。');
    console.log('');

    const filepath = path.resolve(__dirname, file);
    const existingEnv = await loadExistingEnv(filepath);

    if (existingEnv) {
        console.log('既存の .env を検出しました。Enter で現在の値を保持します。');
        console.log('');
    }

    const config = {};

    for (const [key, templateDefault] of Object.entries(defaultConfig)) {
        const isNew = existingEnv && !(key in existingEnv);
        const currentValue = existingEnv?.[key] ?? null;
        const effectiveDefault = currentValue ?? templateDefault;
        const newMark = isNew ? ' [NEW]' : '';

        if (key.endsWith('_KEY') || key.endsWith('_PEPPER')) {
            if (currentValue) {
                // 既存値あり: Enter でそのまま保持
                const answer = await askQuestion(
                    `${key}${newMark} keep / yes (再生成) / [input value]: `
                );
                if (answer === '' || answer === 'keep') {
                    config[key] = currentValue;
                } else if (answer === 'yes') {
                    config[key] = generateSecret();
                } else {
                    config[key] = answer;
                }
            } else {
                // 既存値なし: 新規生成を促す
                const answer = await askQuestion(
                    `${key}${newMark} yes (生成) / [input value]: `
                );
                if (answer === 'yes' || answer === '') {
                    config[key] = generateSecret();
                } else {
                    config[key] = answer;
                }
            }
        } else {
            const displayDefault = effectiveDefault !== '' ? effectiveDefault : '(空)';
            const answer = await askQuestion(
                `${key}${newMark} (default: ${displayDefault}): `
            );
            config[key] = answer !== '' ? answer : effectiveDefault;
        }
    }

    // defaultConfig にないが既存 .env にあるキーはそのまま保持
    if (existingEnv) {
        for (const [key, value] of Object.entries(existingEnv)) {
            if (!(key in defaultConfig)) {
                config[key] = value;
            }
        }
    }

    rl.close();

    const envContent = Object.entries(config)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

    await fs.writeFile(filepath, envContent, 'utf-8');

    console.log('\n.env file saved:');
    console.log(envContent);
})();
