import crypto from 'crypto'

export function issueFormToken(c: any): string {
    const token = crypto.randomBytes(32).toString('hex')
    c.get('session').set('form_token', token)
    return token
}

export function consumeFormToken(c: any, submitted: unknown): boolean {
    const session = c.get('session')
    const stored = session.get('form_token')
    session.set('form_token', undefined)
    return typeof submitted === 'string' && !!stored && submitted === stored
}

export function isHoneypot(form: Record<string, unknown>): boolean {
    return !!form.website
}
