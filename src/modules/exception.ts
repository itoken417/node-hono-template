import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { errorLogger } from '@modules/logger.ts'
import { sendErrorMail } from '@modules/mailer.ts'
import { ErrorPage } from '@pages/error.tsx'
import { ParseError } from '@modules/parser.ts'

const HTTP_MESSAGES: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    413: 'Request Entity Too Large',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
}

const isApiRequest = (c: Context) => c.req.path.startsWith('/api/')

export const onError = (err: Error, c: Context) => {
    if (err instanceof HTTPException) {
        const status = err.status
        const message = HTTP_MESSAGES[status] ?? err.message
        if (isApiRequest(c)) return c.json({ error: message }, status)
        return c.html(ErrorPage({ status, message }), status)
    }
    if (err instanceof ParseError) {
        if (isApiRequest(c)) return c.json({ error: 'Bad Request' }, 400)
        return c.html(ErrorPage({ status: 400, message: 'Bad Request' }), 400)
    }
    errorLogger.error({
        message: err.message,
        stack:   err.stack,
        method:  c.req.method,
        url:     c.req.path,
    });
    const subject = `[ERROR] ${c.req.method} ${c.req.path}`;
    const body = `message: ${err.message}\n\nstack:\n${err.stack}`;
    sendErrorMail(subject, body).catch(() => {});
    if (isApiRequest(c)) return c.json({ error: 'Internal Server Error' }, 500)
    return c.html(ErrorPage({ status: 500, message: 'Internal Server Error' }), 500);
};

export const notFound = (c: Context) => {
    if (isApiRequest(c)) return c.json({ error: 'Not Found' }, 404)
    return c.html(ErrorPage({ status: 404, message: 'Not Found' }), 404);
};

export function errorHandlers(app: { notFound: Function; onError: Function }) {
    app.notFound(notFound)
    app.onError(onError)
}
