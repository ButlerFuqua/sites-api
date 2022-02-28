import mongoose from 'mongoose'
// Read env variables ==/
import dotenv from 'dotenv'
dotenv.config()

export class SiteDb {

    constructor() {
        this.init()
    }

    async init() {
        const DB = process.env?.DB_CONNECT
        if (!DB)
            throw new Error(`No connection to DB found.`)

        try {
            await mongoose.connect(DB)
            console.info(`Successfully connected to MongoDb.`)
        } catch (error: any) {
            throw new Error(error?.message || JSON.stringify(error))
        }
    }
}