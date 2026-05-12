import { Layout } from '@layouts/public.tsx'
import { Dump } from '@components/Dump.tsx'

type DumpPageProps = {
    data: unknown
}

export const DumpPage = ({ data }: DumpPageProps) => (
    <Layout title="Dump サンプル">
        <h1>Dump サンプル</h1>
        <Dump value={data} label="data" />
    </Layout>
)
