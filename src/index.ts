
import express from 'express'
const app = express()
import cors from 'cors'

// Read env variables ==/
import dotenv from 'dotenv'
dotenv.config()

// Cross origin requests ==/
app.use(cors())

// Body parsing ==/
// app.use(express.urlencoded({ extended: false }))
// app.use(express.json())

// Middleware ==/
if (process.env.ENV === 'DEV') {
    app.use((req, res, next) => {
        console.log(`${req.method}: ${req.url}`) // log requests to the console
        next()
    })
}

// Routes ==/
app.use(`/`, require('./controllers')) // include api

// Listen on port  ==/
PORT = process.env.PORT || 5500
app.listen(PORT, () => console.log(`API listening on port: ${PORT}...`))