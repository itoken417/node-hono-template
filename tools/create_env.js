import fs from 'fs/promises';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const file = '../.env';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 対話形式の入力を設定
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const askQuestion = (question) =>
    new Promise((resolve) => rl.question(question, resolve));

// デフォルトの設定値（必要に応じて調整）
const defaultConfig = {
    PG_HOST: '127.0.0.1',
    PG_PORT: '5432',
    PG_USER: 'app',
    PG_PASSWORD: '',
    PG_DATABASE: 'database',
    SESSION_SECRET_KEY : '',
    NODE_ENV: 'development',
};

(async () => {
    console.log('=== .env File Generator ===');
    const config = {};

    for (const [key, defaultValue] of Object.entries(defaultConfig)) {
        if(key.endsWith('_KEY')){
            const answer = await askQuestion(
                `${key} generate: yes / no /[input value]:`
            );
            if(answer === 'yes'){
                const N = 32;
                const str = crypto.randomBytes(N).toString('base64')
                                .replace(/\+/g, '-')
                                .replace(/\//g, '_')
                                .replace(/=+$/, '');
                config[key] = str;
            }else if(answer === 'no'){
                config[key] = defaultValue;
            }else{
                config[key] = answer;
            }
        } else {
            const answer = await askQuestion(
                `${key} (default: ${defaultValue}): `
            );
            config[key] = answer || defaultValue;
        }
    }

    rl.close();

    const envContent = Object.entries(config)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

    const filepath = path.resolve(__dirname, file);
    console.log(filepath);
    // .env ファイルを作成
    await fs.writeFile(filepath, envContent, 'utf-8');

    console.log('\n.env file created successfully:');
    console.log(envContent);
})();

