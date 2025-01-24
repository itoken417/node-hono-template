import { Hono } from 'hono'
import { html } from 'hono/html'
import { validator } from 'hono/validator'
import { Auth } from '@pages/auth.tsx'
import { pool, cursor } from '@modules/postgres.ts'
import type { SiteData } from '@modules/types.ts'

const authCtl = new Hono().basePath('/auth')

interface Error {
    login_id? : any
    password? : any
}

interface myData {
    error? : Error
    siteData: SiteData
}

authCtl.get('/', async (c) => {
    const props : myData = {
        siteData : {
            title:'auth page',
            description:'test page'
        }
    }
    return c.html(<Auth {...props} />)
})

authCtl.post('/', 
    validator('form', (form) => {

        console.log('validator :',form);
        const login_id = form.login_id;
        const password = form.password;
        const error : Error = {login_id :"",password : ""};
        let error_flag = false;
        if (!login_id || typeof login_id !== 'string') {
            error["login_id"] = html`<div class="err">ログインIDが空</div>`;
            error_flag = true;
        }
        if (!password || typeof password !== 'string') {
            error["password"] = html`<div class="err">パスワードが空</div>`;
            error_flag = true;
        }
        console.log(error);
        if(error_flag){
            return {error : error};
        }
        return {login_id : login_id, password : password };
    }),
    async (c) => {
        const form = c.req.valid('form');

        let props : myData = {
            siteData : {
                title:'auth page',
                description:'test page',
            }
        }
        if( form.error ){
            props.error = form.error;
        }else{
            const login_id = form.login_id as string;
            const password = form.password as string;
            const sql = `SELECT * FROM member
                WHERE 
                    login_id = $1 AND password = $2 
                ORDER BY id LIMIT 1;`;
            const csr = cursor(sql,[login_id,password]);
            const client = await pool.connect();
            const itr = client.query(csr);
            const member = await itr.read(1);
            csr.close();
            client.release()
console.log(member)
            if(member.length){
                const session = c.get('session');
                const id = session.set('login',member[0].id);
                console.log(session);
                return c.redirect('/member',302);
            }
            props.error = {login_id:html`` , password:html``} as Error;
        }
        return c.html(<Auth {...props} />)
    }
);

export {authCtl}
