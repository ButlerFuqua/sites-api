import mongoose from 'mongoose'

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
            console.log(`Successfully connected to MongoDb.`)
        } catch (error: any) {
            throw new Error(error?.message || JSON.stringify(error))
        }
    }
}