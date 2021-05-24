const express = require('express')
const games = express.Router() 

games.get('/', (req,res)=>{
    res.redirect('https://www.addictinggames.com/')
})

module.exports = {games}