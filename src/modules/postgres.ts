import Pool from "pg-pool";
import Cursor from "pg-cursor";
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    host: process.env.PG_HOST,
    user: process.env.PG_USER,
    database: process.env.PG_DATABASE,
    max: 10,
});

const cursor = (sql: string, values: string[], config?: any) => {
    const cursor = new Cursor(sql, values, config);
    return cursor;
};

class db {
    public client: any;
    public cursor: any;
    async init() {
        console.log('db init')
        this.client = await pool.connect();
        console.log(this)
    }
    public async execute(sql: string, params = []) {
        return (await this.client.query(sql, params)).rows;
    }
    public async release() {
        if(this.client){
            await this.client.release(true);
        }
    }
    public async begin() {
        await this.client.query("BEGIN");
    }
    public async commit() {
        await this.client.query("COMMIT");
    }
    public async rollback() {
        await this.client.query("ROLLBACK");
    }
    public set_cursor(sql: string, values : string[], config?: any): void {
        console.log(values);
        this.cursor = new Cursor(sql, values, config);
    }
    public close_cursor(): void {
        this.cursor.close();
    }
    public async read_cursor(num: number) {
        const itr = await this.client.query(this.cursor);
        const result = itr.read(num);
        return result;
    }
}

const getdb = async () => {
    const postgres = new db();
    await postgres.init();
    console.log(postgres);
    return postgres;
};

export { getdb, pool, cursor };
