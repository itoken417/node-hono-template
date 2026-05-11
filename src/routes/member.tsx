import { Hono } from 'hono'
import { Page } from '@pages/member.tsx'

const memberCtl = new Hono().basePath('/member')

memberCtl.get('/', async (c) => {
    const member = c.get('member');
    return c.html(<Page member={member} />)
})

memberCtl.post('/logout', async (c) => {
    const session = c.get('session');
    session.deleteSession();
    return c.redirect('/auth', 302);
})

export {memberCtl}

