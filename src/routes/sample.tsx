import { Hono } from 'hono'
import { SampleIndexPage } from '@pages/sample/index.tsx'

const sampleCtl = new Hono().basePath('/sample')

sampleCtl.get('/', (c) => c.html(<SampleIndexPage />))

export { sampleCtl as sample }
