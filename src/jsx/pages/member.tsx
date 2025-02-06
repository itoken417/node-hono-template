import { html } from 'hono/html'
import { Layout } from '@layouts/authorised.tsx'

export const Page = (props: { member?: any }) => {
console.log("-----------------------props");
console.log(props);
return html`
<Layout>
  <h1>Hello ${props.member?.name}</h1>
  <ul>
  </ul>
</Layout>
`
}
