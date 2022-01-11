module.exports = class SiteDb {

    db = process.env?.DB || undefined

    constructor() {
        this.init()
    }

    async init() {

        const DB = process.env?.DB_CONNECT

        if (DB) { // Connect to actual database
            async (DB) => {

                mongoose.connect(DB, { useNewUrlParser: true, useUnifiedTopology: true })

                const db = mongoose.connection
                mongoose.set('useCreateIndex', true)
                db.on('error', console.error.bind(console, 'connection error:'))
                db.once('open', () => console.log(`Successfully conected to MongoDB production database.`))

            }
        } else { // Connect to fake data
            // console.log("require('./fake')()", require('./fake'))
            return this.db = require('./fake')
        }

    }
}