import type { SiteData } from '@modules/types'
import { Layout } from '@layouts/public.tsx'
import { HoneypotField } from '@components/HoneypotField.tsx'

type RegisterProps = {
    siteData: SiteData
    errors?: Record<string, string>
    values?: { login_id?: string; email?: string }
    token?: string
}

export const Register = ({ siteData, errors, values, token }: RegisterProps) => (
    <Layout {...siteData}>
        <h1>メンバー登録</h1>
        <form method="post" class="auth-form">
            <HoneypotField />
            <input type="hidden" name="_token" value={token ?? ''} />
            {errors?.login_id && <div class="err">{errors.login_id}</div>}
            <span>ログインID</span>
            <input name="login_id" type="text" value={values?.login_id ?? ''} />

            {errors?.email && <div class="err">{errors.email}</div>}
            <span>メールアドレス</span>
            <input name="email" type="email" value={values?.email ?? ''} />

            {errors?.password && <div class="err">{errors.password}</div>}
            <span>パスワード</span>
            <input name="password" type="password" />

            {errors?.password_confirm && <div class="err">{errors.password_confirm}</div>}
            <span>パスワード（確認）</span>
            <input name="password_confirm" type="password" />

            <input type="submit" value="確認メールを送信" />
        </form>
        <p><a href="/auth">ログインはこちら</a></p>
    </Layout>
)
