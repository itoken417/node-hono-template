import { Hono } from 'hono'

const topCtl = new Hono()

topCtl.get('/', (c) => c.text('Hello Hono!'))

export { topCtl as top }
