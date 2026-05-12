import { inspect } from 'util'

export function dump(value: unknown): string {
    return inspect(value, { depth: null, colors: false })
}
