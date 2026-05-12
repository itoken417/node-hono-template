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

export const req = (label: string): Rule => (value) =>
    !value || typeof value !== 'string' || value.trim() === ''
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

// ひらがな（長音符「ー」U+30FC を含む）
export const hira = (label: string): Rule => (value) =>
    typeof value === 'string' && /^[ぁ-ゖー]+$/.test(value)
        ? null
        : `${label}はひらがなで入力してください`

// カタカナ（長音符「ー」U+30FC を含む）
export const kana = (label: string): Rule => (value) =>
    typeof value === 'string' && /^[ァ-ヶー]+$/.test(value)
        ? null
        : `${label}はカタカナで入力してください`

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

// ひらがな＋数字（長音符「ー」を含む）
export const hiraNum = (label: string): Rule => (value) =>
    typeof value === 'string' && /^[ぁ-ゖー0-9]+$/.test(value)
        ? null
        : `${label}はひらがな・数字で入力してください`

// カタカナ＋数字（長音符「ー」を含む）
export const kanaNum = (label: string): Rule => (value) =>
    typeof value === 'string' && /^[ァ-ヶー0-9]+$/.test(value)
        ? null
        : `${label}はカタカナ・数字で入力してください`

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
