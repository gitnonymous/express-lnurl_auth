const seco = require('secure-container')
const axios = require('axios')
const lnurl = require('lnurl')
const { verifyAuthorizationSignature } = require('lnurl/lib')
const rb = require('randombytes')
function encode(id){
   const {encryptedData} = seco.encrypt(id, {passphrase: process.env.PASSPHRASE})
   const data = encryptedData.toString('hex')
   return data
}
function decode(d){
    try {
        const {data} = seco.decrypt(Buffer.from(d, 'hex'), process.env.PASSPHRASE)
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
    p.method.toLowerCase() == 'delete' && (k = 'LNB_ADMIN_KEY')
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
function lnurl_authEncode(p){
    const apiKey = {
        id: process.env.LNURL_ID,
        key: process.env.LNURL_KEY,
        encoding: 'hex',
    };
    const tag = 'login';
    const params = {
        cid: p.cid,
        k1:p.k1,
        action: p.type
    };
    const options = {
        baseUrl: process.env.LNURL_AUTH_BASEURL,
        encode: true,
    };
    const signedUrl = lnurl.createSignedUrl(apiKey, tag, params, options);
    console.log(signedUrl);
    return signedUrl
    
}
function random(n){
    return rb(n).toString('hex')
}
function lnauthUrl(p){
    const url = `${process.env.LNURL_AUTH_BASEURL}?cid=${p.cid}&k1=${p.k1}&tag=login&action=${p.type}`
    return url
}



// uncomment and generate lnurl api key initial
// (()=>{
//     const { id, key, encoding } = lnurl.generateApiKey();
//     console.log({ id, key, encoding });
// })()


module.exports={
    encode,
    decode,
    fetchio,
    authorized,
    lnurl_authEncode,
    random,
    lnauthUrl,
    verifyAuthorizationSignature
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