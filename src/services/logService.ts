import { Log } from '../persistance/models/log'
require('../persistance')

export class LogService {

    async logInfo(message: string, data = {}) {
        try {
            return await Log.create({
                type: `info`,
                message,
                data,
            })
        } catch (error) {
            return { error }
        }
    }

    async logError(message: string, data = {}) {
        try {
            return await Log.create({
                type: `error`,
                message,
                data,
            })
        } catch (error) {
            return { error }
        }
    }

    async logWarning(message: string, data = {}) {
        try {
            return await Log.create({
                type: `warning`,
                message,
                data,
            })
        } catch (error) {
            return { error }
        }
    }

}

