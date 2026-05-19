import { Layout } from '@layouts/public.tsx'

type Props = {
    apiKey: string
}

const buildScript = (apiKey: string) => `
const API_KEY = ${JSON.stringify(apiKey)}

async function loadItems() {
    const res = await fetch('/api/sample/item', {
        headers: { 'X-API-Key': API_KEY },
    })
    const data = await res.json()
    if (!res.ok) {
        document.getElementById('items-result').textContent = 'エラー: ' + data.error
        return
    }
    renderItems(data.items)
}

function renderItems(items) {
    const el = document.getElementById('items-result')
    if (items.length === 0) {
        el.innerHTML = '<p>アイテムがありません</p>'
        return
    }
    el.innerHTML = items.map(item => \`
        <div class="api-item">
            <span>#\${item.id} \${item.name} — ¥\${item.price}</span>
            <button onclick="deleteItem(\${item.id})">削除</button>
        </div>
    \`).join('')
}

async function createItem(e) {
    e.preventDefault()
    const name  = document.getElementById('item-name').value.trim()
    const price = Number(document.getElementById('item-price').value)
    if (!name || isNaN(price)) return

    const res = await fetch('/api/sample/item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
        body: JSON.stringify({ name, price }),
    })
    const data = await res.json()
    if (!res.ok) { alert('エラー: ' + data.error); return }
    document.getElementById('item-name').value = ''
    document.getElementById('item-price').value = ''
    await loadItems()
}

async function deleteItem(id) {
    const res = await fetch(\`/api/sample/item/\${id}\`, {
        method: 'DELETE',
        headers: { 'X-API-Key': API_KEY },
    })
    if (!res.ok) { const d = await res.json(); alert('エラー: ' + d.error); return }
    await loadItems()
}

window.deleteItem = deleteItem

window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('create-form').addEventListener('submit', createItem)
    loadItems()
})
`

export const ApiSamplePage = ({ apiKey }: Props) => (
    <Layout title="API サンプル">
        <h1>API サンプル</h1>

        <section class="api-section">
            <h2>アイテム一覧</h2>
            <div id="items-result">読み込み中…</div>
        </section>

        <section class="api-section">
            <h2>アイテム追加</h2>
            <form id="create-form" class="api-form">
                <input id="item-name"  type="text"   placeholder="名前" required />
                <input id="item-price" type="number" placeholder="価格" required min="0" />
                <button type="submit">追加</button>
            </form>
        </section>

        <script dangerouslySetInnerHTML={{ __html: buildScript(apiKey) }} />
    </Layout>
)
