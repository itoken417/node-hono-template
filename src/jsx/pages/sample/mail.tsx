import { Layout } from '@layouts/public.tsx'

type MailFormProps = {
    error?: {
        name?: string
        email?: string
        subject?: string
        message?: string
    }
    sent?: boolean
}

export const MailForm = (props: MailFormProps) => (
    <Layout title="メールフォーム サンプル">
        {props.sent ? (
            <div>
                <h1>送信完了</h1>
                <p>メールを送信しました。</p>
                <a href="/sample/mail">戻る</a>
            </div>
        ) : (
            <div>
                <h1>メールフォーム サンプル</h1>
                <form method="post">
                    <div>
                        {props.error?.name && <span>{props.error.name}</span>}
                        <label>お名前</label>
                        <input name="name" type="text" />
                    </div>
                    <div>
                        {props.error?.email && <span>{props.error.email}</span>}
                        <label>メールアドレス</label>
                        <input name="email" type="email" />
                    </div>
                    <div>
                        {props.error?.subject && <span>{props.error.subject}</span>}
                        <label>件名</label>
                        <input name="subject" type="text" />
                    </div>
                    <div>
                        {props.error?.message && <span>{props.error.message}</span>}
                        <label>本文</label>
                        <textarea name="message"></textarea>
                    </div>
                    <input type="submit" value="送信" />
                </form>
            </div>
        )}
    </Layout>
)
