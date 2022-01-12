const Site = require('../persistence/models/site')

module.exports = class ReadService {

    async getSites(criteria) {
        try {
            return await Site.find(criteria || {})
        } catch (error) {
            return {
                status: 500,
                error: error.message || JSON.stringify(error),
            }
        }
    }

    async getOneSite(id) {
        // Return latest 3 posts
        try {
            return await Site.findById(id)
        } catch (error) {
            return {
                status: 500,
                error: error.message || JSON.stringify(error),
            }
        }
    }

    async getSitePosts(id) {
        // return
    }
}