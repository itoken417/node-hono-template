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
            // Strict: クロスサイトリクエストでは一切クッキーを送信しない
            sameSite: 'Strict',
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
        },
    })
}

export type SessionSettings = {
    session: Session<SessionDataTypes>,
    session_key_rotation: boolean
};

