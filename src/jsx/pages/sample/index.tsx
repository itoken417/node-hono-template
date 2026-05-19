import { Layout } from '@layouts/public.tsx'

export const SampleIndexPage = () => (
    <Layout title="サンプル一覧">
        <h1>サンプル一覧</h1>
        <ul>
            <li><a href="/sample/api">API サンプル</a> — APIキー認証付きREST APIをfetchで叩く</li>
            <li><a href="/sample/dump">Dump サンプル</a> — 任意の値をダンプ表示</li>
            <li><a href="/sample/mail">メールフォーム サンプル</a> — バリデーション・ハニーポット・フォームトークン付きお問い合わせフォーム</li>
            <li>エラーページ サンプル
                <ul style="margin-top: 0.4em; padding-left: 1.5em;">
                    <li><a href="/sample/error/400">400</a> Bad Request</li>
                    <li><a href="/sample/error/401">401</a> Unauthorized</li>
                    <li><a href="/sample/error/403">403</a> Forbidden</li>
                    <li><a href="/sample/error/404">404</a> Not Found</li>
                    <li><a href="/sample/error/422">422</a> Unprocessable Entity</li>
                    <li><a href="/sample/error/429">429</a> Too Many Requests</li>
                    <li><a href="/sample/error/500">500</a> Internal Server Error</li>
                </ul>
            </li>
        </ul>
    </Layout>
)
