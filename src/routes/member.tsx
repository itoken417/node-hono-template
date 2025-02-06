import { Hono } from 'hono'
import { Page } from '@pages/member.tsx'

const memberCtl = new Hono().basePath('/member')

memberCtl.get('/', async (c) => {
//    console.log(c);
    const member = c.get('member');

    return c.html(<Page member={member} />)
})

export {memberCtl}

