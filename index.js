require('dotenv').config()
const express = require('express')
const app = express()
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const path = require('path')
const coParser = require('cookie-parser')
const iocook = require('socket.io-cookie-parser')
const cors = require('cors')
const morgan = require('morgan')
const {encode, decode, authorized} = require('./js/helpers')
const {router:api} = require('./routes/api')
const PORT = process.env.PORT || 8080
//middleware
app.use(coParser())
app.use(morgan('dev'))
app.use(express.json())
io.use(iocook())
app.use(cors({origin: '*'}))
//socket
const connected = {}
io.on('connection', (socket=>{
    const {_wlio} = socket.request.cookies
    connected[_wlio] = socket.id
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
        res.sendFile(path.join(__dirname+'/index.html')) // replace index with website homepage
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
        let date = new Date().valueOf()
        res.cookie('_wlio', date, { maxAge: 300000, httpOnly: false, secure: true })
        res.sendFile(path.join(__dirname+'/login.html'))
    }
})
// logout route
app.get('/logout', (req,res)=>{
    res.clearCookie('__wl__')
    res.redirect('/')
})
// api routes
app.use('/api/*',api)
// lnurl-auth webhook
app.get('/webhook/lnurlauth',  async(req,res)=>{
    let {cid} = req.query, id ='DHqgQuinqnYGrXUiSG4PgZ'
    console.log(connected[cid]);
    setTimeout(_=> io.to(connected[cid]).emit('login', {id:connected[cid], msg: id}),2500)
    res.json({success: cid})
})
server.listen(PORT, _=> console.log(`server running on port ${PORT}`))