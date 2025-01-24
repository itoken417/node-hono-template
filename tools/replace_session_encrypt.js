import fs from 'fs/promises';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const N = 32
const str = crypto.randomBytes(N).toString('base64').substring(0, N)
console.log(str)

const file = '../src/index.tsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function replace_crypto(file, search, str) {
    //console.log(__dirname);
    const filepath = path.resolve(__dirname, file)
    //console.log(filepath);
    try {
        const data = await fs.readFile(filepath, 'utf-8');
        if (data.match(search)) {
            const updated = data.replace(search, str);
            await fs.writeFile(filepath, updated, 'utf-8');
            console.log('文字列を置換しました！');
        }else{
            console.log('文字列「' + search + '」が見つかりません')
        }
    } catch (error) {
        console.error('エラーが発生しました:', error);
    }
}

replace_crypto(file, /(encryptionKey:\s*['"])[^'"]+(['"])/,`$1${str}$2`);

