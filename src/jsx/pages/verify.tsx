import type { SiteData } from '@modules/types'
import { Layout } from '@layouts/public.tsx'
import { HoneypotField } from '@components/HoneypotField.tsx'

type VerifyProps = {
    siteData: SiteData
    errors?: Record<string, string>
    token?: string
}

export const Verify = ({ siteData, errors, token }: VerifyProps) => (
    <Layout {...siteData}>
        <h1>メールアドレス確認</h1>
        <p>登録メールアドレスに確認コードを送信しました。<br />コードを入力して登録を完了してください（有効期限: 30分）。</p>
        <form method="post" class="auth-form">
            <HoneypotField />
            <input type="hidden" name="_token" value={token ?? ''} />
            {errors?.code && <div class="err">{errors.code}</div>}
            <span>確認コード（6桁）</span>
            <input name="code" type="text" inputmode="numeric" maxlength="6" autocomplete="one-time-code" />
            <input type="submit" value="確認" />
        </form>
    </Layout>
)
