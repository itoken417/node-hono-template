import readline from 'readline';
import crypto from 'crypto';
import { promisify } from 'util';
import { config } from 'dotenv';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: path.resolve(__dirname, '../.env') });

const scrypt = promisify(crypto.scrypt);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const askQuestion = (question) =>
    new Promise((resolve) => rl.question(question, resolve));

const askPassword = (question) =>
    new Promise((resolve) => {
        process.stdout.write(question);
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.setEncoding('utf8');
        let password = '';
        const onData = (ch) => {
            if (ch === '\n' || ch === '\r' || ch === '') {
                process.stdin.setRawMode(false);
                process.stdin.pause();
                process.stdin.removeListener('data', onData);
                process.stdout.write('\n');
                if (ch === '') process.exit();
                resolve(password);
            } else if (ch === '') {
                password = password.slice(0, -1);
            } else {
                password += ch;
            }
        };
        process.stdin.on('data', onData);
    });

async function hashPassword(password) {
    const pepper = process.env.APP_PEPPER;
    if (!pepper) throw new Error('APP_PEPPER が .env に設定されていません');
    const pepperedPassword = `${pepper}:${password}`;
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = await scrypt(pepperedPassword, salt, 64);
    return { salt, hash: hash.toString('hex') };
}

(async () => {
    console.log('=== メンバー追加 ===');
    console.log('このスクリプトは、ログイン ID とパスワードを入力してメンバーテーブルに登録します。');
    console.log('パスワードは scrypt + pepper でハッシュ化して保存されます。');
    console.log('');

    const login_id = await askQuestion('login_id: ');
    if (!login_id.trim()) {
        console.error('login_id は必須です');
        rl.close();
        process.exit(1);
    }

    const email = await askQuestion('email (任意、空でスキップ): ');

    const password = await askPassword('password (非表示): ');
    if (!password.trim()) {
        console.error('password は必須です');
        rl.close();
        process.exit(1);
    }

    const password2 = await askPassword('password (確認): ');
    rl.close();

    if (password !== password2) {
        console.error('パスワードが一致しません');
        process.exit(1);
    }

    const client = new pg.Client({
        host: process.env.PG_HOST,
        port: parseInt(process.env.PG_PORT || '5432'),
        user: process.env.PG_USER,
        password: process.env.PG_PASSWORD,
        database: process.env.PG_DATABASE,
    });

    try {
        await client.connect();

        const existing = await client.query(
            'SELECT id FROM member WHERE login_id = $1',
            [login_id.trim()]
        );
        if (existing.rows.length > 0) {
            console.error(`login_id '${login_id.trim()}' は既に登録されています`);
            process.exit(1);
        }

        const { salt, hash } = await hashPassword(password);
        const emailVal  = email.trim() || null;
        const emailHash = emailVal ? crypto.createHash('sha256').update(emailVal).digest('hex') : null;
        const result = await client.query(
            'INSERT INTO member (login_id, email, email_hash, password, salt) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [login_id.trim(), emailVal, emailHash, hash, salt]
        );

        console.log(`メンバーを追加しました (id: ${result.rows[0].id})`);
    } catch (err) {
        console.error('エラー:', err.message);
        process.exit(1);
    } finally {
        await client.end();
    }
})();
