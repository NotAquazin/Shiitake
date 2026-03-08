const express = require('express')
const pool = require('./database')
const port = 1337

const app = express()
app.use(express.json())

// Routes
app.get('/', (req,res) => {
    res.sendStatus(200)
})

app.post('/', (req,res) => {
    const {name, location} = req.body
    res.status(200).send({
        message: `YOUR KEYS WERE ${name}, ${location}`
    })
})

app.listen(port, () => console.log(`Server has started on port: ${port}`))