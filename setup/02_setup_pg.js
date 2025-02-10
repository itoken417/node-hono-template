#!/usr/bin/env node
import { execSync } from "child_process";
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';
import { existsSync } from "fs";

// 環境変数を読み込み
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const askQuestion = (question) =>
    new Promise((resolve) => rl.question(question, resolve));

(async () => {
    console.log('=== PG setup ===');
    const envVars = { ...process.env };
    if (envVars.PG_PASSWORD) {
        envVars.PGPASSWORD = envVars.DB_PASSWORD;
    }
    console.log('データベースが存在しているか確認。');
    const checkDbExists = `psql -h ${process.env.PG_HOST} -U ${process.env.PG_USER} -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '${process.env.PG_DATABASE}';"`;

    const dbExists = execSync(checkDbExists, { env: envVars, encoding: "utf-8" }).trim();
    if (dbExists !== "1") {
        console.log(`データベース '${process.env.PG_DATABASE}' が見つからないので、. 作成...`);
        execSync(`createdb -h ${process.env.PG_HOST} -U ${process.env.PG_USER} ${process.env.PG_DATABASE}`, {
            stdio: "inherit",
            env: envVars,
        });
        console.log(`Database '${process.env.PG_DATABASE}' created successfully.`);
    } else {
        console.log(`Database '${process.env.PG_DATABASE}' already exists. Skipping creation.`);
    }

    const schema = '../sql/schema.sql';
    const schema_path = path.resolve(__dirname, schema);

    if (!existsSync(schema_path)) {
        console.error("sqlフォルダにスキーマファイル ${schema} が見つかりません");
        process.exit(1);
    }

    try {
        console.log("スキーマの流し込み...");
        // スキーマを流し込み

        execSync(`psql -h ${process.env.PG_HOST} -U ${process.env.PG_USER} -d ${process.env.PG_DATABASE} -f ${schema_path}`, {
            stdio: "inherit",
            env: envVars,
        });
        console.log("Database setup completed successfully!");
    }catch(err){
        console.error("Failed to apply database setup:", err.message);
        process.exit(1);
    }
})();
