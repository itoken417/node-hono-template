import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'

const errorCtl = new Hono().basePath('/sample/error')

errorCtl.get('/400', (c) => { throw new HTTPException(400) })
errorCtl.get('/401', (c) => { throw new HTTPException(401) })
errorCtl.get('/403', (c) => { throw new HTTPException(403) })
errorCtl.get('/404', (c) => { throw new HTTPException(404) })
errorCtl.get('/422', (c) => { throw new HTTPException(422) })
errorCtl.get('/429', (c) => { throw new HTTPException(429) })
errorCtl.get('/500', (c) => { throw new Error('サンプル 500 エラー') })

export { errorCtl as sampleError }
