import { sessionMiddleware, Session, CookieStore} from 'hono-sessions'
import type { SessionDataTypes } from '@modules/types.ts'
import dotenv from 'dotenv';

dotenv.config();

const store = new CookieStore()

export const SessionMiddleware = () => {
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

export type SessionSettings = {
    session: Session<SessionDataTypes>,
    session_key_rotation: boolean
};

