import fs from 'fs'
import path from 'path'

if (!fs.existsSync(path.resolve(process.cwd(), '.env'))) {
    console.error('.env ファイルが見つかりません。setup スクリプトを実行してください。')
    process.exit(1)
}
