import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { decryptEnv } from './env_crypto.ts'

const cwd = process.cwd()

// APP_ENV_KEY を先に読み込む
const envKeyPath = path.resolve(cwd, '.env.key')
if (fs.existsSync(envKeyPath)) {
    dotenv.config({ path: envKeyPath })
}

const envPath = path.resolve(cwd, '.env')
if (!fs.existsSync(envPath)) {
    console.error('.env ファイルが見つかりません。setup スクリプトを実行してください。')
    process.exit(1)
}
dotenv.config()

// enc: プレフィックスの値を復号
decryptEnv()
