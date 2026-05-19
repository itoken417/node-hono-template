import fs from 'fs/promises';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const rl  = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

const nginxConf = (domain, port) => `
server {
    listen 80;
    server_name ${domain};
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name ${domain};

    ssl_certificate     /etc/letsencrypt/live/${domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${domain}/privkey.pem;

    location / {
        proxy_pass         http://localhost:${port};
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_set_header   Upgrade           $http_upgrade;
        proxy_set_header   Connection        'upgrade';
    }
}
`.trimStart();

(async () => {
    console.log('=== NGINX 設定ファイル生成 ===');
    console.log('server/etc/nginx/conf.d/ 以下に設定ファイルを生成します。');
    console.log('');

    const domain = (await ask('ドメイン名 (例: example.com): ')).trim();
    if (!domain) { console.error('ドメイン名を入力してください。'); rl.close(); process.exit(1); }

    const portInput = (await ask('アプリのポート番号 (default: 3000): ')).trim();
    const port = portInput || '3000';

    rl.close();

    const outDir  = path.resolve(__dirname, '../server/etc/nginx/conf.d');
    const outPath = path.join(outDir, `${domain}.conf`);

    await fs.mkdir(outDir, { recursive: true });
    await fs.writeFile(outPath, nginxConf(domain, port), 'utf-8');

    console.log(`\n設定ファイルを生成しました: ${outPath}`);
    console.log('');
    console.log('以下の手順を root で実行してください:');
    console.log('');
    console.log('# 1. Let\'s Encrypt 証明書取得 (DNS チャレンジ)');
    console.log(`  certbot certonly --manual --preferred-challenges dns -d ${domain}`);
    console.log('');
    console.log('# 2. nginx 設定ファイルをコピー');
    console.log(`  cp ${outPath} /etc/nginx/conf.d/${domain}.conf`);
    console.log('');
    console.log('# 3. nginx テスト & リロード');
    console.log('  nginx -t && systemctl reload nginx');
    console.log('');
    console.log('# 4. 証明書の自動更新 (任意)');
    console.log('  echo "0 3 * * * root certbot renew --quiet && systemctl reload nginx" \\');
    console.log('    > /etc/cron.d/certbot-renew');
})();
