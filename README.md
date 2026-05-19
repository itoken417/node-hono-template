# nodejs + hono + postgres

### postgresql インストール

- ポスグレユーザー作成

```
sudo su - postgres -c "createuser -s [ユーザー]"

```


### nodejsを準備

<https://github.com/nvm-sh/nvm>

```
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install --lts

```

### 新規プロジェクト作成


```
git clone https://github.com/itoken417/node-hono-template.git ./[プロジェクト名]
```

### 以下を使うと便利


<https://github.com/itoken417/node-hono-create>


### 手動で設定


```
cd ./[プロジェクト名]
npm install
node ./setup/01_create_env.js
node ./setup/02_setup_pg.js
node ./setup/03_add_admin.js
node ./setup/04_add_member.js
node ./setup/05_test_mail.js
```

### とりあえず実行


```
npm run dev
```

ブラウザで確認

```
http://localhost:3000
```

---

## セットアップスクリプト

| スクリプト | 説明 |
|-----------|------|
| `01_create_env.js` | `.env` ファイルを対話形式で生成 |
| `02_setup_pg.js` | PostgreSQLのデータベースとテーブルを作成 |
| `03_add_admin.js` | 管理者アカウントを追加 |
| `04_add_member.js` | 一般メンバーアカウントを追加 |
| `05_test_mail.js` | SMTPメール送信のテスト |
| `06_setup_nginx.js` | nginx設定ファイル・systemdサービスファイル・root実行スクリプトを生成 |

---

## 本番デプロイ

### nginx + systemd + Let's Encrypt

CSRF保護はリクエストの `Origin` ヘッダーとサーバー側のオリジンを比較して検証する。ブラウザは `https://` のページからのフォーム送信にのみ `Origin` ヘッダーを付与するため、HTTPSなしでは正常に動作しない。nginx をリバースプロキシとして使い、Let's Encrypt で TLS を終端させることが前提となる。

```
node ./setup/06_setup_nginx.js
```

以下のファイルが生成される。

| ファイル | 説明 |
|---------|------|
| `server/etc/nginx/conf.d/{domain}.conf` | nginx設定（TLS 1.2/1.3、HSTS、gzip） |
| `server/etc/systemd/system/{appname}.service` | systemdサービス定義 |
| `server/setup_root.sh` | root実行用の一括セットアップシェル |

root権限で一括セットアップ（certbot DNSチャレンジ → nginx → systemd）を実行する。

```
sudo bash server/setup_root.sh
```

### 本番起動

```
npm start
```

---

## サンプル

`src/routes/sample/` 以下を参照。

| ファイル | URL | 説明 |
|---------|-----|------|
| `sample/api.tsx` | `/sample/api` | APIキー認証付きREST APIをfetchで叩くサンプルページ |
| `sample/dump.tsx` | `/sample/dump` | `dumper.ts` の出力確認ページ |
| `sample/error.tsx` | `/sample/error/:status` | 各HTTPエラー（400/401/403/404/422/429/500）の表示確認 |
| `sample/mail.tsx` | `/sample/mail` | バリデーション・ハニーポット・フォームトークン付きお問い合わせフォーム |


---

## モジュール一覧

### validator.ts

フォームバリデーション用のルール関数群。`validate(form, schema)` でまとめてチェックできる。

| 関数 | 説明 |
|------|------|
| `req(label)` | 必須 |
| `email(label)` | メールアドレス形式 |
| `minLen(label, n)` | n文字以上 |
| `maxLen(label, n)` | n文字以内 |
| `hira(label)` | ひらがなのみ |
| `kana(label)` | カタカナのみ |
| `ascii(label)` | ASCII文字のみ |
| `alnum(label)` | 半角英数字のみ |
| `num(label)` | 数字のみ |
| `hiraNum(label)` | ひらがな＋数字 |
| `kanaNum(label)` | カタカナ＋数字 |
| `moreEq(label, n)` | n以上 |
| `lessEq(label, n)` | n以下 |
| `moreThan(label, n)` | nより大きい |
| `lessThan(label, n)` | n未満 |

### mailer.ts

nodemailer を使ったメール送信。`NODE_ENV=production` のときのみ実際に送信し、開発環境ではコンソールに出力するだけ。

- `sendMail(to, subject, body)` — 任意の宛先に送信
- `sendErrorMail(subject, body)` — `ERROR_TO` 宛にエラー通知を送信

### exception.ts

Hono の `onError` / `notFound` ハンドラー。500 エラー発生時は `pino` でログを記録し、本番環境では `sendErrorMail` でメール通知する。`/api/` パスのエラーはJSON形式で返す。

### dumper.ts

デバッグ用のダンプ関数。`dump(value)` で任意の値を読みやすい文字列に変換する（Node.js `util.inspect` ベース）。

### logger.ts

pino を使ったアクセスログ・エラーログ。ログは `LOG_DIR` で指定したディレクトリに出力される。

### apiKey.ts

APIキーのインメモリ管理。サーバー再起動でリセットされる。

- `issueApiKey(label)` — APIキーを発行して返す
- `validateApiKey(key)` — APIキーの有効性を検証する

