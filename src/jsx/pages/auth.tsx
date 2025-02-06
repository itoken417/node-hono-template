import { html } from 'hono/html'
import type {SiteData} from '@modules/types'
import { Layout } from '@layouts/public.tsx'

export const Auth = (props: { siteData: SiteData, error?: any }) => (
<Layout {...props.siteData}>{html`
    <h1>Auth</h1>
    <form method="post">
        ${props.error?.login_id}
        ${props.error?.password}
        <span>ログインID</span><input name="login_id" type="text">
        <span>パスワード</span><input name="password" type="password">
        <input type="submit" value="ログイン">
    </form>
`}</Layout>
)

