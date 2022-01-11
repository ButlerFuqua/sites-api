const { db } = require('../persistence/')

module.exports = class ReadService {

    getSites(criteria) {
        return db.find(criteria || {})
    }

    getOneSite(id) {
        // Return latest 3 posts
        return db.find({ _id: id })
    }

    getSitePosts(id) {
        // return
    }
}