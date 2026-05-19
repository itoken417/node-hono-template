import type { Hono } from 'hono'
import { top } from '@routes/top.tsx'
import { auth } from '@routes/auth'
import { register } from '@routes/register'
import { member } from '@routes/member'
import { adminAuth } from '@routes/admin/auth'
import { admin } from '@routes/admin/index'
import { sample } from '@routes/sample.tsx'
import { sampleError } from '@routes/sample/error'
import { sampleMail } from '@routes/sample/mail'
import { sampleDump } from '@routes/sample/dump'
import { api } from '@routes/api'
import { apiSample } from '@routes/api/sample'
import { sampleApi } from '@routes/sample/api.tsx'

export function routes(app: Hono<any>) {
    app.route('/', top)
    app.route('/', auth)
    app.route('/', register)
    app.route('/', member)
    app.route('/', adminAuth)
    app.route('/', admin)
    app.route('/', sample)
    app.route('/', sampleError)
    app.route('/', sampleMail)
    app.route('/', sampleDump)
    app.route('/', api)
    app.route('/', apiSample)
    app.route('/', sampleApi)
}
