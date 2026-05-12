import { Layout } from '@layouts/public.tsx'

export const ErrorPage = (props: { status: number; message: string }) => (
    <Layout title="エラー">
        <h1>{props.status}</h1>
        <p>{props.message}</p>
    </Layout>
)
