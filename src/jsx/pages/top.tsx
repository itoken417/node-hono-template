import { html } from 'hono/html'
import { Layout } from '@layouts/public.tsx'

export const Top = (props: { messages: string[] }) => html`
<Layout>
  <h1>Hello Hono!</h1>
  <ul>
    ${props.messages.map((message) => {
      return <li>{message}!!</li>
    })}
  </ul>
</Layout>
`
