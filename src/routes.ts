import type { Hono } from 'hono'
import { authCtl } from '@routes/auth'
import { registerCtl } from '@routes/register'
import { memberCtl } from '@routes/member'
import { errorCtl } from '@routes/sample/error'
import { mailCtl } from '@routes/sample/mail'
import { dumpCtl } from '@routes/sample/dump'

export function routes(app: Hono<any>) {
    app.route('/', authCtl)
    app.route('/', registerCtl)
    app.route('/', memberCtl)
    app.route('/', errorCtl)
    app.route('/', mailCtl)
    app.route('/', dumpCtl)
}
