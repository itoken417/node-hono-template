import readline from 'readline';
import crypto from 'crypto';
import { promisify } from 'util';
import { config } from 'dotenv';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

config({ path: path.resolve(__dirname, '../.env') });

const scrypt = promisify(crypto.scrypt);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const ask = (q) => new Promise((r) => rl.question(q, r));

const askPassword = (q) => new Promise((resolve) => {
    process.stdout.write(q);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    let pw = '';
    const onData = (ch) => {
        if (ch === '\n' || ch === '\r' || ch === '') {
            process.stdin.setRawMode(false);
            process.stdin.pause();
            process.stdin.removeListener('data', onData);
            process.stdout.write('\n');
            if (ch === '') process.exit();
            resolve(pw);
        } else if (ch === '') {
            pw = pw.slice(0, -1);
        } else {
            pw += ch;
        }
    };
    process.stdin.on('data', onData);
});

async function hashPassword(password) {
    const pepper = process.env.APP_PEPPER;
    if (!pepper) throw new Error('APP_PEPPER が .env に設定されていません');
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = await scrypt(`${pepper}:${password}`, salt, 64);
    return { salt, hash: hash.toString('hex') };
}

(async () => {
    console.log('=== 管理者追加 ===');

    const login_id = await ask('login_id: ');
    if (!login_id.trim()) { console.error('login_id は必須です'); rl.close(); process.exit(1); }

    const password  = await askPassword('password (非表示): ');
    const password2 = await askPassword('password (確認): ');
    rl.close();

    if (!password) { console.error('password は必須です'); process.exit(1); }
    if (password !== password2) { console.error('パスワードが一致しません'); process.exit(1); }

    const client = new pg.Client({
        host:     process.env.PG_HOST,
        port:     parseInt(process.env.PG_PORT || '5432'),
        user:     process.env.PG_USER,
        password: process.env.PG_PASSWORD,
        database: process.env.PG_DATABASE,
    });

    try {
        await client.connect();
        const existing = await client.query(
            'SELECT id FROM admin WHERE login_id = $1', [login_id.trim()]);
        if (existing.rows.length > 0) {
            console.error(`login_id '${login_id.trim()}' は既に登録されています`);
            process.exit(1);
        }
        const { salt, hash } = await hashPassword(password);
        const result = await client.query(
            'INSERT INTO admin (login_id, password, salt) VALUES ($1, $2, $3) RETURNING id',
            [login_id.trim(), hash, salt]);
        console.log(`管理者を追加しました (id: ${result.rows[0].id})`);
    } catch (err) {
        console.error('エラー:', err.message);
        process.exit(1);
    } finally {
        await client.end();
    }
})();
