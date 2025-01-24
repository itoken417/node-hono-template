import crypto from 'crypto'
const N = 32
console.log(crypto.randomBytes(N).toString('base64').substring(0, N))
