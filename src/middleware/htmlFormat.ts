import { createMiddleware } from 'hono/factory'
import beautify from 'js-beautify'

const { html_beautify } = beautify

export const htmlFormatMiddleware = createMiddleware(async (c, next) => {
    await next()
    const contentType = c.res.headers.get('content-type') ?? ''
    if (!contentType.includes('text/html')) return
    const raw = await c.res.text()
    const formatted = html_beautify(raw, {
        indent_size: 4,
        max_preserve_newlines: 1,
        wrap_line_length: 0,
    })
    c.res = new Response(formatted, { status: c.res.status, headers: c.res.headers })
})
