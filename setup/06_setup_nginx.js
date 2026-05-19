import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import readline from 'readline';
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

// チャレンジタイプを確認
const rl  = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(resolve => rl.question(q, resolve));

console.log('証明書取得のチャレンジタイプを選択してください:');
console.log('  1) DNS-01  （手動・DNSレコード設定が必要、自動更新不可）');
console.log('  2) HTTP-01 （ポート80が必要、自動更新可能）');

let answer = '';
while (!['1', '2'].includes(answer.trim())) {
    answer = await ask('選択 [1/2]: ');
}
rl.close();

const isDns = answer.trim() === '1';

// --- nginx 共通 SSL ブロック ---
const sslBlock = `
    ssl_certificate     /etc/letsencrypt/live/${domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${domain}/privkey.pem;

    ssl_protocols             TLSv1.2 TLSv1.3;
    ssl_ciphers               ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache         shared:SSL:10m;
    ssl_session_timeout       1d;
    ssl_session_tickets       off;

    # HSTS (初回は短めに設定し、問題なければ max-age を伸ばす)
    add_header Strict-Transport-Security "max-age=86400" always;

    gzip         on;
    gzip_vary    on;
    gzip_proxied any;
    gzip_types   text/plain text/css text/javascript application/json application/javascript;

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
    }`;

// --- nginx 設定 ---
const nginxConf = isDns
    ? `server {
    listen 80;
    server_name ${domain};
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name ${domain};
${sslBlock}
}
`
    : `server {
    listen 80;
    server_name ${domain};

    # HTTP-01 チャレンジ用（更新時にも使用）
    location /.well-known/acme-challenge/ {
        root /var/lib/letsencrypt/;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name ${domain};
${sslBlock}
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

// --- DNS-01 用 root スクリプト ---
const rootShDns = `#!/bin/bash
set -e

# 1. Let's Encrypt 証明書取得 (DNS-01 チャレンジ)
echo "certbot の指示に従い、DNS の TXT レコードを設定してください。"
certbot certonly --manual --preferred-challenges dns -d ${domain}

# 2. nginx 設定をシンボリックリンク & 起動
ln -sf ${confSrcPath} ${confDstPath}
nginx -t && (systemctl reload nginx 2>/dev/null || systemctl start nginx)

# 3. systemd サービスを登録 & 起動
ln -sf ${serviceSrcPath} ${serviceDstPath}
mkdir -p /etc/systemd/system/multi-user.target.wants
ln -sf ${serviceDstPath} /etc/systemd/system/multi-user.target.wants/${serviceName}
systemctl daemon-reload
systemctl start  ${serviceName}
systemctl status ${serviceName}

echo ""
echo "完了！ https://${domain} でアクセスできます。"
echo ""
echo "※ DNS-01 チャレンジは自動更新できません。"
echo "   証明書の更新時は以下を実行してください:"
echo "   sudo bash ${appDir}/server/renew_cert.sh"
`;

// --- DNS-01 用証明書更新スクリプト ---
const renewCertSh = `#!/bin/bash
set -e

echo "証明書を手動更新します（DNS-01 チャレンジ）"
echo "certbot の指示に従い、DNS の TXT レコードを更新してください。"
certbot certonly --manual --preferred-challenges dns -d ${domain} --force-renewal
systemctl reload nginx
echo "更新完了！"
`;

// --- HTTP-01 用 root スクリプト ---
const rootShHttp = `#!/bin/bash
set -e

WEBROOT=/var/lib/letsencrypt

# 1. webroot ディレクトリ作成
mkdir -p \$WEBROOT/.well-known/acme-challenge

# 2. 一時 HTTP 設定を作成して nginx を起動 (certbot 検証用)
cat > /etc/nginx/conf.d/certbot-tmp.conf <<'ENDCONF'
server {
    listen 80;
    server_name ${domain};
    location /.well-known/acme-challenge/ {
        root /var/lib/letsencrypt/;
    }
}
ENDCONF
nginx -t && (systemctl reload nginx 2>/dev/null || systemctl start nginx)

# 3. Let's Encrypt 証明書取得 (HTTP-01 チャレンジ)
certbot certonly --webroot -w \$WEBROOT -d ${domain}

# 4. 一時設定を削除、本番設定をシンボリックリンク & リロード
rm /etc/nginx/conf.d/certbot-tmp.conf
ln -sf ${confSrcPath} ${confDstPath}
nginx -t && systemctl reload nginx

# 5. systemd サービスを登録 & 起動
ln -sf ${serviceSrcPath} ${serviceDstPath}
mkdir -p /etc/systemd/system/multi-user.target.wants
ln -sf ${serviceDstPath} /etc/systemd/system/multi-user.target.wants/${serviceName}
systemctl daemon-reload
systemctl start  ${serviceName}
systemctl status ${serviceName}

# 6. 証明書の自動更新
echo "0 3 * * * root certbot renew --quiet && systemctl reload nginx" \\
  > /etc/cron.d/certbot-renew

echo ""
echo "完了！ https://${domain} でアクセスできます。"
`;

// ファイル生成
await fs.mkdir(path.dirname(confSrcPath),    { recursive: true });
await fs.mkdir(path.dirname(serviceSrcPath), { recursive: true });
await fs.writeFile(confSrcPath,    nginxConf,   'utf-8');
await fs.writeFile(serviceSrcPath, serviceConf, 'utf-8');

const rootShPath = path.join(appDir, 'server/setup_root.sh');
await fs.writeFile(rootShPath, isDns ? rootShDns : rootShHttp, 'utf-8');
await fs.chmod(rootShPath, 0o755);

if (isDns) {
    const renewCertShPath = path.join(appDir, 'server/renew_cert.sh');
    await fs.writeFile(renewCertShPath, renewCertSh, 'utf-8');
    await fs.chmod(renewCertShPath, 0o755);
    console.log(`証明書更新スクリプト: ${renewCertShPath}`);
}

console.log(`nginx 設定ファイル  : ${confSrcPath}`);
console.log(`systemd サービス    : ${serviceSrcPath}`);
console.log(`root 用スクリプト   : ${rootShPath}`);
console.log('');
console.log('以下を root で実行してください:');
console.log(`  sudo bash ${rootShPath}`);
