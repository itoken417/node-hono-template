import { html } from 'hono/html'
import type { SiteData } from '@modules/types'
import dotenv from 'dotenv'

dotenv.config()

const appName = process.env.APP_NAME || 'MyApp'

export const AdminLayout = (props: SiteData) => html`
<!doctype html>
<html>
<head prefix="og: http://ogp.me/ns#">
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${appName}${props.title ? ` | ${props.title}` : ''}</title>
    <link href="/static/css/main.css" rel="stylesheet">
</head>
    <body>
        <header>
            <nav>
                <span class="nav-brand">${appName} [管理]</span>
                <form method="post" action="/admin/logout">
                    <button type="submit">ログアウト</button>
                </form>
            </nav>
        </header>
        <main>
            ${props.children}
        </main>
    </body>
</html>
`
