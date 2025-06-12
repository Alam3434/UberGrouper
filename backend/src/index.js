require('dotenv').config()
const express = require('express')
const cors    = require('cors')
const connect = require('./config/db')
const groups  = require('./routes/groups')
const join    = require('./routes/join')

const app = express()
app.use(cors(), express.json())

connect()                      // mongoose.connect(...)
app.use('/groups', groups)
app.use('/join',   join)

const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log(`🚀 backend on ${PORT}`))
