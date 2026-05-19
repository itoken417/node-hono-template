import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

config({ path: path.resolve(__dirname, '../.env') });

const domain = process.env.APP_DOMAIN;
const port   = process.env.APP_PORT || '3000';

if (!domain) {
    console.error('APP_DOMAIN が .env に設定されていません。');
    process.exit(1);
}

const nginxConf = `server {
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
`;

const outDir  = path.resolve(__dirname, '../server/etc/nginx/conf.d');
const outPath = path.join(outDir, `${domain}.conf`);

await fs.mkdir(outDir, { recursive: true });
await fs.writeFile(outPath, nginxConf, 'utf-8');

console.log(`設定ファイルを生成しました: ${outPath}`);
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
