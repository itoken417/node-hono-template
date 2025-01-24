import { Hono } from 'hono'
import { Top } from '@pages/top.tsx'

const memberCtl = new Hono().basePath('/member')

memberCtl.get('/', async (c) => {
    const member = c.member;

    const messages = ['Welcome']
    return c.html(<Top messages={messages} />)
})

export {memberCtl}

