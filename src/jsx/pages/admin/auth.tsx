import type { SiteData } from '@modules/types'
import { Layout } from '@layouts/public.tsx'

type AdminAuthProps = {
    siteData: SiteData
    errors?: Record<string, string>
}

export const AdminAuth = ({ siteData, errors }: AdminAuthProps) => (
    <Layout {...siteData}>
        <h1>管理者ログイン</h1>
        <form method="post" class="auth-form">
            {errors?.login_id && <div class="err">{errors.login_id}</div>}
            <span>ログインID</span><input name="login_id" type="text" />
            {errors?.password && <div class="err">{errors.password}</div>}
            <span>パスワード</span><input name="password" type="password" />
            <input type="submit" value="ログイン" />
        </form>
    </Layout>
)
