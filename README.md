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
node ./setup/create_env.js
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

