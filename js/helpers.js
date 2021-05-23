const seco = require('secure-container')
const b64 = require('url-safe-base64')
const axios = require('axios')
function encode(id){
   const {encryptedData} = seco.encrypt(id, {passphrase: process.env.PASSPHRASE})
   const urlsafe = b64.encode(encryptedData.toString('base64'))
   return urlsafe
}
function decode(d){
    try {
        const urlsafe = b64.decode(d)
        const {data} = seco.decrypt(Buffer.from(urlsafe, 'base64'), process.env.PASSPHRASE)
        return data.toString('utf-8')
    } catch (err) {
        throw {error: {step: 'decode', msg:'Unauthorized Access'}}
    }
}
async function fetchio(p){
    let k;
    p.url.includes('users') && (k = 'LNB_INVOICE_KEY')
    p.url.includes('win')  && (k = 'LNB_ADMIN_KEY')
    p.url.includes('lose') && (k = 'LNB_ADMIN_KEY')
    let payload = {}
    payload.url = process.env.LNBITS_BASE+p.url
    payload.method = p.method
    payload.headers = {"X-Api-Key":process.env[k], "Content-type":'application/json'}
    p.method.toLowerCase() == 'post' && (payload.data = p.data)
    const {data} = await axios(payload)
    return data
}
function authorized(req,res,next){
    try {
        decode(req.cookies.__wl__)
        next()
    } catch (err) {
        res.redirect('/login')
    }
}
module.exports={
    encode,
    decode,
    fetchio,
    authorized
}
// browser side fetch
// const res = await(await fetch('api/',{
//     method:'POST',
//     headers:{
//         "Content-type":'application/json',
//     },
//     body:JSON.stringify({
//         method:'GET',
//         url: '/users?id=__&logs=true',
//         data:null
//     })
// })).json()