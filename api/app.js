const PORT = process.env.PORT || 3000
const HOST = 'http://127.0.0.1'
const express = require('express')
const cors = require('cors')
const app = express()

const router = require('./routes/index.js')

app.use(express.json())
app.use(cors())
app.use('/api/v1/', router)

app.get('/test', (req, res) => res.send('Hello World!'))
app.post('/test-post', (req, res) => res.send('Received data:', req.body))

app.listen(PORT, async () => {
  console.log(`Express app running on host ${HOST}:${PORT}`)
})

process.on('uncaughtException', (error) => {
  console.log(error)
})
