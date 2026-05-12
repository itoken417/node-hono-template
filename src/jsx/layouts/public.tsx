import { html } from 'hono/html'
import type { SiteData } from '@modules/types'
import dotenv from 'dotenv'

dotenv.config()

const appName = process.env.APP_NAME || 'MyApp'

export const Layout = (props: SiteData) => html`
<!doctype html>
<html>
<head>
    <link href="/static/css/main.css" rel="stylesheet">
    <meta name="description" content="${props.description}">
    <head prefix="og: http://ogp.me/ns#">
    <meta property="og:type" content="article">
    <meta property="og:title" content="${appName}">
    <title>${appName}${props.title ? ` | ${props.title}` : ''}</title>
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
