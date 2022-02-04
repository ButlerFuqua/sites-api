import { Log } from '../persistence/models/log'
require('../persistence')

export class LogService {

    async logInfo(message, data = {}) {
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

    async logError(message, data = {}) {
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

    async logWarning(message, data = {}) {
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

