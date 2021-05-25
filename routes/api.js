const express = require('express')
const router = express.Router()
const {encode, decode, fetchio} = require('../js/helpers')


router.route('/')
.get(async(req,res)=>{
    try {
        const {id,action,cid,k1} = req.query
        const connected = req.app.locals.connected
        if(connected[cid].k1 !== k1) throw {error: 'Unauthorized login attempt'} 
        if(action == 'login'){
            let {success, error} = await fetchio({
                method:'GET',
                // url: '/users?id='+id
                url: '/users?id=lnurl_auth&lnurl_auth='+id
            })
            if(error) return res.status(400).json({error})
            res.cookie('__wl__', encode(success.usr.id), { maxAge: process.env.MAXAGE, httpOnly: true, secure: true })
            res.redirect('/')
        }
        else if(action == 'register'){
            let {success, error} = await fetchio({
                method:'POST',
                url: '/users',
                data: {
                    lnurl_auth: id
                }
            })
            if(error) return res.status(400).json({error})
            res.cookie('__wl__', encode(success.id), { maxAge: process.env.MAXAGE, httpOnly: true, secure: true })
            res.redirect('/')
        }
    } catch (err) {
        res.status(400).json(err.error)
    }
})
.post(async(req,res)=>{
    try {
        let id = decode(req.cookies.__wl__), {url, method, data} = req.body 
        url = url.replace(/__/g,id)
        const {success} = await fetchio({
            url,
            method,
            data
        })
        res.json(success)
    } catch (err) {
        console.log(err);
        res.status(400).json(err.error)
    }
})

module.exports={
    router
}