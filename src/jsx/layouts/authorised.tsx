import { html } from 'hono/html'

interface SiteData {
  title: string
  description: string
  image: string
  children?: any
}

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
        <nav>test</nav>
        </header>
        ${props.children}
    </body>
</html>
`
