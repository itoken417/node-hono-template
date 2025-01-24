import { sessionMiddleware, CookieStore} from 'hono-sessions'
import dotenv from 'dotenv';

dotenv.config();

const store = new CookieStore()

export default () => {
   return sessionMiddleware({
        store,
        encryptionKey: process.env.SESSION_SECRET_KEY,
        expireAfterSeconds: 900,
        cookieOptions: {
            sameSite: 'Lax',
            path: '/', 
            httpOnly: true,
        },
    })
}

