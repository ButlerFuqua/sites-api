const Site = require('../persistence/models/site')
const Post = require('../persistence/models/post')

module.exports = class ReadSiteService {

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

    async getOneSite(unique) {
        // Return latest 3 posts
        try {
            return await Site.findOne({ unique }).populate({
                path: 'posts',
                options: { limit: 3, sort: { 'updated_at': -1 } }
            })
        } catch (error) {
            return {
                status: 500,
                error: error.message || JSON.stringify(error),
            }
        }
    }

    async getSitePosts(id, skip, limit) {
        try {
            return await Post.find({ site: id }, null, { sort: { 'updated_at': -1 }, skip: skip || 0, limit: limit || 10, }).exec()
        } catch (error) {
            return {
                status: 500,
                error: error.message || JSON.stringify(error),
            }
        }
    }

    async getOnePost(id) {
        try {
            return await Post.findById(id)
        } catch (error) {
            return {
                status: 500,
                error: error.message || JSON.stringify(error),
            }
        }
    }
}