import fs from 'fs/promises';
import { execSync } from 'child_process';
import readline from 'readline';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));
const tryExec = (cmd) => { try { return execSync(cmd, { encoding: 'utf-8' }); } catch { return null; } };

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
    console.log('=== NGINX + Let\'s Encrypt セットアップ ===');
    console.log('このスクリプトは nginx の設定と Let\'s Encrypt 証明書（DNSチャレンジ）を取得します。');
    console.log('root 権限が必要です。');
    console.log('');

    if (process.getuid?.() !== 0) {
        console.error('root で実行してください。(sudo node setup/06_setup_nginx.js)');
        process.exit(1);
    }

    if (!tryExec('which nginx')) {
        console.error('nginx がインストールされていません。');
        console.error('  例: sudo dnf install nginx  /  sudo apt install nginx');
        process.exit(1);
    }

    if (!tryExec('which certbot')) {
        console.error('certbot がインストールされていません。');
        console.error('  例: sudo dnf install certbot  /  sudo apt install certbot');
        process.exit(1);
    }

    const domain = (await ask('ドメイン名 (例: example.com): ')).trim();
    if (!domain) { console.error('ドメイン名を入力してください。'); rl.close(); process.exit(1); }

    const portInput = (await ask('アプリのポート番号 (default: 3000): ')).trim();
    const port = portInput || '3000';

    rl.close();

    // --- certbot DNS チャレンジ ---
    console.log('');
    console.log('=== Let\'s Encrypt 証明書取得 (DNS チャレンジ) ===');
    console.log('certbot の指示に従い、DNS に TXT レコードを追加してください。');
    console.log('');

    try {
        execSync(`certbot certonly --manual --preferred-challenges dns -d ${domain}`, {
            stdio: 'inherit',
        });
    } catch {
        console.error('certbot が失敗しました。証明書が取得できませんでした。');
        process.exit(1);
    }

    // --- nginx 設定ファイル ---
    const confPath = `/etc/nginx/conf.d/${domain}.conf`;
    await fs.writeFile(confPath, nginxConf(domain, port), 'utf-8');
    console.log(`\nnginx 設定ファイルを作成しました: ${confPath}`);

    // --- nginx テスト & リロード ---
    try {
        execSync('nginx -t', { stdio: 'inherit' });
        execSync('systemctl reload nginx', { stdio: 'inherit' });
        console.log('nginx をリロードしました。');
    } catch {
        console.error(`nginx の設定テストに失敗しました。${confPath} を確認してください。`);
        process.exit(1);
    }

    console.log('');
    console.log(`完了！ https://${domain} でアクセスできます。`);
    console.log('');
    console.log('証明書の自動更新を有効にする場合:');
    console.log('  echo "0 3 * * * root certbot renew --quiet && systemctl reload nginx" \\');
    console.log('    > /etc/cron.d/certbot-renew');
})();
