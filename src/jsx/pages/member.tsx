import { Layout } from '@layouts/authorised.tsx'

export const Page = (props: { member?: any }) => (
    <Layout>
        <h1>Hello {props.member?.login_id}</h1>
        <ul>
        </ul>
    </Layout>
)
