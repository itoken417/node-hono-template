export interface SiteData {
    title? : string
    description? : string
    children? : string
}

export type SessionDataTypes = {
    'login'            : number
    'admin_login'      : number
    'pending_register' : string
    'form_token'       : string
}
