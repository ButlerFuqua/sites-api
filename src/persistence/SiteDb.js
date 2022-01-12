const mongoose = require('mongoose')

module.exports = class SiteDb {

    constructor() {
        this.init()
    }

    async init() {
        const DB = process.env?.DB_CONNECT
        if (!DB)
            throw new Error(`No connection to DB found.`)

        try {
            await mongoose.connect(DB, { useNewUrlParser: true, useUnifiedTopology: true })
            console.log(`Successfully connected to MongoDb.`)
        } catch (error) {
            throw new Error(error)
        }
    }
}