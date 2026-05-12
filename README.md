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

Hono の `onError` / `notFound` ハンドラー。500 エラー発生時は `pino` でログを記録し、本番環境では `sendErrorMail` でメール通知する。

### dumper.ts

デバッグ用のダンプ関数。`dump(value)` で任意の値を読みやすい文字列に変換する（Node.js `util.inspect` ベース）。

### logger.ts

pino を使ったアクセスログ・エラーログ。ログは `LOG_DIR` で指定したディレクトリに出力される。

---

## 環境変数

| 変数名 | 説明 |
|--------|------|
| `NODE_ENV` | `production` のとき本番モード |
| `LOG_DIR` | ログ出力ディレクトリ |
| `SYSTEM_MAIL` | 送信元メールアドレス |
| `ERROR_TO` | エラー通知の宛先メールアドレス |
| `SMTP_HOST` | SMTPサーバーホスト |
| `SMTP_PORT` | SMTPポート（デフォルト: 587） |
| `SMTP_SECURE` | TLS使用する場合は `true` |
| `SMTP_USER` | SMTPユーザー名 |
| `SMTP_PASSWORD` | SMTPパスワード |
| `PG_HOST` | PostgreSQLホスト |
| `PG_PORT` | PostgreSQLポート |
| `PG_USER` | PostgreSQLユーザー |
| `PG_PASSWORD` | PostgreSQLパスワード |
| `PG_DATABASE` | データベース名 |
| `SESSION_SECRET_KEY` | セッション署名キー |
| `APP_PEPPER` | パスワードハッシュ用ペッパー |
