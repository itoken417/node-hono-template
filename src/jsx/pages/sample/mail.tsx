import { Layout } from '@layouts/public.tsx'

type MailFormProps = {
    error?: {
        name?: string
        email?: string
        subject?: string
        message?: string
    }
    sent?: boolean
    token?: string
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
                    <div class="field-optional" inert="">
                        <input type="text" name="website" autocomplete="off" />
                    </div>
                    <input type="hidden" name="_token" value={props.token ?? ''} />

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
                        <label for="type">お問い合わせ種別</label>
                        <select id="type" name="type">
                            <option value="">選択してください</option>
                            <option value="product">製品について</option>
                            <option value="service">サービスについて</option>
                            <option value="other">その他</option>
                        </select>
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

                    <div class="field">
                        <label>希望連絡方法</label>
                        <div class="radio-group">
                            <label class="radio-item">
                                <input type="radio" name="contact" value="email" checked />
                                <label>メール</label>
                            </label>
                            <label class="radio-item">
                                <input type="radio" name="contact" value="phone" />
                                <label>電話</label>
                            </label>
                        </div>
                    </div>

                    <div class="field">
                        <div class="check-group">
                            <label class="check-item">
                                <input type="checkbox" name="agree" value="1" />
                                <label>個人情報の取り扱いに同意する</label>
                            </label>
                        </div>
                    </div>

                    <input type="submit" value="送信する" />
                </form>
            </>
        )}
    </Layout>
)
