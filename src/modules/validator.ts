type Rule = (value: unknown) => string | null
type Schema = Record<string, Rule[]>

export function validate(
    form: Record<string, unknown>,
    schema: Schema
): Record<string, string> {
    const errors: Record<string, string> = {}
    for (const [field, rules] of Object.entries(schema)) {
        for (const rule of rules) {
            const msg = rule(form[field])
            if (msg) { errors[field] = msg; break }
        }
    }
    return errors
}

// 半角・全角スペースを除去してからルールを適用
export const _delSp = (rule: Rule): Rule => (value) =>
    typeof value === 'string'
        ? rule(value.replace(/[ \u3000]/g, ''))
        : rule(value)

export const req = (label: string): Rule => (value) =>
    !value || typeof value !== 'string' || value.replace(/[ \u3000]/g, '') === ''
        ? `${label}を入力してください`
        : null

export const email = (label: string): Rule => (value) => {
    if (!value || typeof value !== 'string') return `${label}を入力してください`
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        ? null
        : `${label}の形式が正しくありません`
}

export const minLen = (label: string, min: number): Rule => (value) =>
    typeof value === 'string' && value.length >= min
        ? null
        : `${label}は${min}文字以上で入力してください`

export const maxLen = (label: string, max: number): Rule => (value) =>
    typeof value === 'string' && value.length <= max
        ? null
        : `${label}は${max}文字以内で入力してください`

// ひらがな U+3041(ぁ)〜U+3096(ゖ)、長音符 U+30FC(ー) を含む
export const hira = (label: string): Rule => _delSp((value) =>
    typeof value === 'string' && /^[\u3041-\u3096\u30FC]+$/.test(value)
        ? null
        : `${label}はひらがなで入力してください`
)

// カタカナ U+30A1(ァ)〜U+30F6(ヶ)、長音符 U+30FC(ー) を含む
export const kana = (label: string): Rule => _delSp((value) =>
    typeof value === 'string' && /^[\u30A1-\u30F6\u30FC]+$/.test(value)
        ? null
        : `${label}はカタカナで入力してください`
)

// 印字可能 ASCII（U+0020〜U+007E）
export const ascii = (label: string): Rule => (value) =>
    typeof value === 'string' && /^[\x20-\x7E]+$/.test(value)
        ? null
        : `${label}はASCII文字で入力してください`

// 半角英数字のみ
export const alnum = (label: string): Rule => (value) =>
    typeof value === 'string' && /^[A-Za-z0-9]+$/.test(value)
        ? null
        : `${label}は半角英数字で入力してください`

// 数字のみ（半角）
export const num = (label: string): Rule => (value) =>
    typeof value === 'string' && /^[0-9]+$/.test(value)
        ? null
        : `${label}は数字で入力してください`

// ひらがな U+3041〜U+3096 ＋数字、長音符 U+30FC を含む
export const hiraNum = (label: string): Rule => _delSp((value) =>
    typeof value === 'string' && /^[\u3041-\u3096\u30FC0-9]+$/.test(value)
        ? null
        : `${label}はひらがな・数字で入力してください`
)

// カタカナ U+30A1〜U+30F6 ＋数字、長音符 U+30FC を含む
export const kanaNum = (label: string): Rule => _delSp((value) =>
    typeof value === 'string' && /^[\u30A1-\u30F6\u30FC0-9]+$/.test(value)
        ? null
        : `${label}はカタカナ・数字で入力してください`
)

// n 以上（value >= n）
export const moreEq = (label: string, n: number): Rule => (value) => {
    const v = Number(value)
    return !isNaN(v) && v >= n ? null : `${label}は${n}以上で入力してください`
}

// n 以下（value <= n）
export const lessEq = (label: string, n: number): Rule => (value) => {
    const v = Number(value)
    return !isNaN(v) && v <= n ? null : `${label}は${n}以下で入力してください`
}

// n 未満（value < n）
export const lessThan = (label: string, n: number): Rule => (value) => {
    const v = Number(value)
    return !isNaN(v) && v < n ? null : `${label}は${n}未満で入力してください`
}

// n より大きい（value > n）
export const moreThan = (label: string, n: number): Rule => (value) => {
    const v = Number(value)
    return !isNaN(v) && v > n ? null : `${label}は${n}より大きい値を入力してください`
}
