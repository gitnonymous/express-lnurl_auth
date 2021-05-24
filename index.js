require('dotenv').config()
const express = require('express'), app = express(), http = require('http'), server = http.createServer(app),
{ Server } = require("socket.io"), io = new Server(server), path = require('path'),
coParser = require('cookie-parser'), iocook = require('socket.io-cookie-parser'), cors = require('cors'),
morgan = require('morgan'), {encode, decode, authorized} = require('./js/helpers'),
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
    _wlio && (connected[_wlio] = socket.id)
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
        let date = new Date().valueOf(), url = 'lnbc100u1ps24v36pp5fs4q5ssymmgzq2w6f62fnmjerhvn8fdxxzu7d2ge0lf7vsf67nwsdq2d3hxzat5dqxq9p5hsqrzjqtqkejjy2c44jrwj08y5ygqtmn8af7vscwnflttzpsgw7tuz9r40ls9vlzgr878x65qqqqd3qqqq89gqjqsp5qypqxpq9qcrsszg2pvxq6rs0zqg3yyc5z5tpwxqergd3c8g7rusq9qypqsqjkjta8ejh4f24ct7ct6crrjacf6gnkde7nvkgzugxpasralp0pdhgdfv8tz8ux524dymc8wfswgcpfq5s38u7fhhgplpprwqc5n0gdsqqfe05p',
        register = false
        req.query.register && (register = true)
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
    let {cid} = req.query, id ='DHqgQuinqnYGrXUiSG4PgZ'
    console.log(connected[cid]);
    setTimeout(_=> io.to(connected[cid]).emit('login', {id:connected[cid], msg: id}),2500)
    res.json({success: cid})
})
// catch other requests and pass to homepage
app.get('/*',(req,res)=>{
    res.redirect('/')
})
// initialize server
const PORT = process.env.PORT || 8080
server.listen(PORT, _=> console.log(`server running on port ${PORT}`))