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
    <Layout title="お問い合わせ">
        {props.sent ? (
            <div class="sent-box">
                <h1>送信完了</h1>
                <p>お問い合わせありがとうございました。内容を確認のうえ、折り返しご連絡いたします。</p>
                <a href="/sample/mail" class="back-link">← 戻る</a>
            </div>
        ) : (
            <>
                <h1>お問い合わせ</h1>
                <form method="post" class="mail-form">
                    <div class="field">
                        <label for="name">お名前</label>
                        {props.error?.name && <p class="err">{props.error.name}</p>}
                        <input id="name" name="name" type="text" />
                    </div>
                    <div class="field">
                        <label for="email">メールアドレス</label>
                        {props.error?.email && <p class="err">{props.error.email}</p>}
                        <input id="email" name="email" type="email" />
                    </div>
                    <div class="field">
                        <label for="subject">件名</label>
                        {props.error?.subject && <p class="err">{props.error.subject}</p>}
                        <input id="subject" name="subject" type="text" />
                    </div>
                    <div class="field">
                        <label for="message">本文</label>
                        {props.error?.message && <p class="err">{props.error.message}</p>}
                        <textarea id="message" name="message" rows={6}></textarea>
                    </div>
                    <input type="submit" value="送信する" />
                </form>
            </>
        )}
    </Layout>
)
