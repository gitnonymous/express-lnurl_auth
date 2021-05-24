require('dotenv').config()
const express = require('express'), app = express(), http = require('http'), server = http.createServer(app),
{ Server } = require("socket.io"), io = new Server(server), path = require('path'),
coParser = require('cookie-parser'), iocook = require('socket.io-cookie-parser'), cors = require('cors'),
morgan = require('morgan'), {encode, decode, authorized, lnurl_authEncode, random, lnauthUrl, verifyAuthorizationSignature:vs} = require('./js/helpers'),
{router:api} = require('./routes/api'), {games} = require('./routes/games')
// view engine
app.set('view engine', 'ejs')
//middleware
app.use(coParser())
app.use(morgan('dev'))
app.use(express.json())
io.use(iocook())
app.use(cors({origin: '*'}))
app.use(express.static('public'))
//socket
const connected = {}
io.on('connection', (socket=>{
    const {_wlio} = socket.request.cookies
    _wlio && (connected[_wlio] && (connected[_wlio].sid = socket.id))
    for(time in connected){// delete socket entries over 5 minutes
        new Date().valueOf() - (+time) > 1000*60*5 && delete connected[time] 
    }
    console.log(connected)
}))
// homepage route
app.get('/',(req,res)=>{
    try {
        //////// if you want access to homepage to be protected
        // !req.cookies.hasOwnProperty('__wl__')
        // ?   (// create user or redirect to login
        //     res.redirect('/login')
        //     )
        // :   (//decode and get user data
        //     decode(req.cookies.__wl__)
        //     ) 
        res.render('index') // replace index with website homepage
    } catch (err) {
        res.status(403).send(err.error)
    }
})
// login route
app.get('/login', (req,res)=>{
    try {
        decode(req.cookies.__wl__)
        res.redirect('/')
    } catch (err) {
        let date = new Date().valueOf(), k1 = random(32), register = false, type = 'login'
        req.query.register && (register = true, type = 'register')
        // let url = lnauthUrl({cid: date, k1, type})
        let url = lnurl_authEncode({cid: date, k1, type})
        console.log(url);
        connected[date] = {k1}
        res.cookie('_wlio', date, { maxAge: 300000, httpOnly: false, secure: true })
        res.render('login', {url, register})
    }
})
// logout route
app.get('/logout', (req,res)=>{
    res.clearCookie('__wl__')
    res.redirect('/')
})
// api routes
app.use('/api',api)
// games routes -- protected route --
app.use('/games', authorized, games)
// lnurl-auth webhook
app.get('/webhook/lnurlauth',  async(req,res)=>{
    let {cid, sig,key,k1, action} = req.query, id ='DHqgQuinqnYGrXUiSG4PgZ' , k1check = (k1 == connected[cid].k1) 
    try {
        const verify = vs(sig, k1, key)
        verify && k1check 
            ? (
            io.to(connected[cid].sid).emit('login', {id:connected[cid].sid, msg: key, action}),
            res.json({status: 'OK'})
            )
            : res.json({status: 'ERROR', reason: 'Authentication failed!'})
        
    } catch (err) {
        res.json({status: 'ERROR', reason: 'Authentication failed!'})
    }
})
// catch other requests and pass to homepage
app.get('/*',(req,res)=>{
    res.redirect('/')
})
// initialize server
const PORT = process.env.PORT || 8080
server.listen(PORT, _=> console.log(`server running on port ${PORT}`));
