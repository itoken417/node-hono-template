import type { SiteData } from '@modules/types'
import { Layout } from '@layouts/public.tsx'
import { HoneypotField } from '@components/HoneypotField.tsx'

type AuthProps = {
    siteData: SiteData
    errors?: Record<string, string>
    token?: string
}

export const Auth = ({ siteData, errors, token }: AuthProps) => (
    <Layout {...siteData}>
        <h1>Auth</h1>
        <form method="post" class="auth-form">
            <HoneypotField />
            <input type="hidden" name="_token" value={token ?? ''} />
            {errors?.login_id && <div class="err">{errors.login_id}</div>}
            <span>ログインID</span><input name="login_id" type="text" />
            {errors?.password && <div class="err">{errors.password}</div>}
            <span>パスワード</span><input name="password" type="password" />
            <input type="submit" value="ログイン" />
        </form>
        <p><a href="/auth/register">新規登録はこちら</a></p>
    </Layout>
)
