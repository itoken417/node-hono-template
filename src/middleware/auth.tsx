import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import { getdb } from '@modules/postgres.ts'

export const authMiddleware = createMiddleware(async (c, next) => {
    await next();

    const session = c.get('session');
    const id = session.get('login');
    let member;
console.log("------------------------id");
console.log(id);
    if(id){
        const sql = `SELECT * FROM member
            WHERE id = $1
            LIMIT 1;
        `
        const mydb = await getdb();
        const ids : string[] = []
        ids.push(id)
        await mydb.set_cursor(sql,ids);
        const result = await mydb.read_cursor(1);
console.log(result)
        mydb.close_cursor();
        mydb.release();
        member = result[0];
    }
    if(member){
        c.set('member',member);
    } else {
        const res = c.redirect('/auth',302);
        const excpt = new HTTPException(302, { res });
        throw excpt;
    }
});

