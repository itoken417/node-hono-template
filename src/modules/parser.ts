import type { Context } from 'hono'

export class ParseError extends Error {}

export async function safeParseBody(
    c: Context
): Promise<Record<string, string | File | (string | File)[]>> {
    try {
        return await c.req.parseBody()
    } catch {
        throw new ParseError()
    }
}
