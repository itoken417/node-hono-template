import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const appDir     = path.resolve(__dirname, '..');

config({ path: path.join(appDir, '.env') });

const domain  = process.env.APP_DOMAIN;
const port    = process.env.APP_PORT || '3000';
const appName = (process.env.APP_NAME || 'app').toLowerCase().replace(/\s+/g, '-');
const runUser = os.userInfo().username;

if (!domain) {
    console.error('APP_DOMAIN が .env に設定されていません。');
    process.exit(1);
}

// --- nginx 設定 (本番向け SSL 強化) ---
const nginxConf = `server {
    listen 80;
    server_name ${domain};
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name ${domain};

    # SSL 証明書
    ssl_certificate     /etc/letsencrypt/live/${domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${domain}/privkey.pem;

    # SSL 強化
    ssl_protocols             TLSv1.2 TLSv1.3;
    ssl_ciphers               ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache         shared:SSL:10m;
    ssl_session_timeout       1d;
    ssl_session_tickets       off;

    # HSTS (初回は短めに設定し、問題なければ max-age を伸ばす)
    add_header Strict-Transport-Security "max-age=86400" always;

    # Gzip
    gzip            on;
    gzip_vary       on;
    gzip_proxied    any;
    gzip_types      text/plain text/css text/javascript application/json application/javascript;

    location / {
        proxy_pass            http://localhost:${port};
        proxy_http_version    1.1;
        proxy_set_header      Host              $host;
        proxy_set_header      X-Real-IP         $remote_addr;
        proxy_set_header      X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header      X-Forwarded-Proto $scheme;
        proxy_set_header      Upgrade           $http_upgrade;
        proxy_set_header      Connection        'upgrade';
        proxy_read_timeout    60s;
        proxy_connect_timeout 10s;
        proxy_send_timeout    60s;
    }
}
`;

// --- systemd サービスファイル ---
const serviceName = `${appName}.service`;
const serviceConf = `[Unit]
Description=${process.env.APP_NAME || appName}
After=network.target

[Service]
Type=simple
User=${runUser}
WorkingDirectory=${appDir}
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=5s
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
`;

const confSrcPath    = path.join(appDir, 'server/etc/nginx/conf.d', `${domain}.conf`);
const confDstPath    = `/etc/nginx/conf.d/${domain}.conf`;
const serviceSrcPath = path.join(appDir, 'server/etc/systemd/system', serviceName);
const serviceDstPath = `/etc/systemd/system/${serviceName}`;

// --- root 用シェルスクリプト ---
const rootSh = `#!/bin/bash
set -e

# 1. Let's Encrypt 証明書取得 (DNS チャレンジ)
certbot certonly --manual --preferred-challenges dns -d ${domain}

# 2. nginx 設定ファイルをコピー & リロード
cp ${confSrcPath} ${confDstPath}
nginx -t && systemctl reload nginx

# 3. systemd サービスを登録 & 起動
cp ${serviceSrcPath} ${serviceDstPath}
systemctl daemon-reload
systemctl enable ${serviceName}
systemctl start  ${serviceName}
systemctl status ${serviceName}

# 4. 証明書の自動更新
echo "0 3 * * * root certbot renew --quiet && systemctl reload nginx" \\
  > /etc/cron.d/certbot-renew

echo ""
echo "完了！ https://${domain} でアクセスできます。"
`;

await fs.mkdir(path.dirname(confSrcPath),    { recursive: true });
await fs.mkdir(path.dirname(serviceSrcPath), { recursive: true });
await fs.writeFile(confSrcPath,    nginxConf,    'utf-8');
await fs.writeFile(serviceSrcPath, serviceConf,  'utf-8');

const rootShPath = path.join(appDir, 'server/setup_root.sh');
await fs.writeFile(rootShPath, rootSh, 'utf-8');
await fs.chmod(rootShPath, 0o755);

console.log(`nginx 設定ファイル  : ${confSrcPath}`);
console.log(`systemd サービス    : ${serviceSrcPath}`);
console.log(`root 用スクリプト   : ${rootShPath}`);
console.log('');
console.log('以下を root で実行してください:');
console.log(`  sudo bash ${rootShPath}`);
