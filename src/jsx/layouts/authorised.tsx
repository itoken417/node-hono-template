import { html } from 'hono/html'
import type {SiteData} from '@modules/types'

export const Layout = (props: SiteData) => html`
<!doctype html>
<html>
<head>
    <link href="/static/css/main.css" rel="stylesheet">
    <meta name="description" content="${props.description}">
    <head prefix="og: http://ogp.me/ns#">
    <meta property="og:type" content="article">
    <meta property="og:title" content="${props.title}">
    <title>${props.title}</title>
</head>
    <body>
        <header>
        <nav>
            <form method="post" action="/member/logout">
                <button type="submit">logout</button>
            </form>
        </nav>
        </header>
        ${props.children}
    </body>
</html>
`
