import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'

export async function safeParseBody(
    c: Context
): Promise<Record<string, string | File | (string | File)[]>> {
    try {
        return await c.req.parseBody()
    } catch {
        throw new HTTPException(400, { message: 'Bad Request' })
    }
}
