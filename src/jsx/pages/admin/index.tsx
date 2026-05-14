import { AdminLayout } from '@layouts/admin.tsx'

type Member = {
    id: number
    login_id: string
    email: string | null
    create_time: string
}

export const AdminIndex = ({ members }: { members: Member[] }) => (
    <AdminLayout title="メンバー一覧">
        <h1>メンバー一覧</h1>
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>ログインID</th>
                    <th>メールアドレス</th>
                    <th>登録日時</th>
                </tr>
            </thead>
            <tbody>
                {members.map((m) => (
                    <tr key={m.id}>
                        <td>{m.id}</td>
                        <td>{m.login_id}</td>
                        <td>{m.email ?? '—'}</td>
                        <td>{new Date(m.create_time).toLocaleString('ja-JP')}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </AdminLayout>
)
