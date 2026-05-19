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

const confSrcPath = path.resolve(__dirname, `../server/etc/nginx/conf.d/${domain}.conf`);
const confDstPath = `/etc/nginx/conf.d/${domain}.conf`;

const rootSh = `#!/bin/bash
set -e

# 1. Let's Encrypt 証明書取得 (DNS チャレンジ)
certbot certonly --manual --preferred-challenges dns -d ${domain}

# 2. nginx 設定ファイルをコピー
cp ${confSrcPath} ${confDstPath}

# 3. nginx テスト & リロード
nginx -t && systemctl reload nginx

# 4. 証明書の自動更新
echo "0 3 * * * root certbot renew --quiet && systemctl reload nginx" \\
  > /etc/cron.d/certbot-renew

echo "完了！ https://${domain} でアクセスできます。"
`;

const confDir   = path.resolve(__dirname, '../server/etc/nginx/conf.d');
const rootShDir = path.resolve(__dirname, '../server');
const rootShPath = path.join(rootShDir, 'setup_root.sh');

await fs.mkdir(confDir, { recursive: true });
await fs.writeFile(confSrcPath, nginxConf, 'utf-8');
await fs.writeFile(rootShPath, rootSh, 'utf-8');
await fs.chmod(rootShPath, 0o755);

console.log(`nginx 設定ファイル : ${confSrcPath}`);
console.log(`root 用スクリプト  : ${rootShPath}`);
console.log('');
console.log('以下を root で実行してください:');
console.log(`  sudo bash ${rootShPath}`);
