import { html } from 'hono/html'
import type { SiteData } from '@modules/types'
import dotenv from 'dotenv'

dotenv.config()

const appName = process.env.APP_NAME || 'MyApp'

export const Layout = (props: SiteData) => html`
<!doctype html>
<html>
<head prefix="og: http://ogp.me/ns#">
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${props.description}">
    <meta property="og:type" content="article">
    <meta property="og:title" content="${appName}">
    <title>${appName}${props.title ? ` | ${props.title}` : ''}</title>
    <link href="/static/css/main.css" rel="stylesheet">
</head>
    <body>
        <header>
            <nav>
                <span class="nav-brand">${appName}</span>
            </nav>
        </header>
        <main>
            ${props.children}
        </main>
    </body>
</html>
`
