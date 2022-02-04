import { Site } from '../persistence/models/site'
import { Post } from '../persistence/models/post'
import { Account } from '../persistence/models/account'

export class ReadSiteService {

    async getSites(criteria, skip, limit) {
        try {
            return await Site.find({ ...(criteria || {}), inNetwork: true }, null, { sort: { 'updated_at': -1 }, skip: skip || 0, limit: limit || 10, }).exec()

        } catch (error) {
            return {
                status: 500,
                error: error.message || JSON.stringify(error),
            }
        }
    }

    async getAllSites(populateSubs) {
        try {
            if (populateSubs) {
                return await Site.find().populate('phoneSubscribers').populate('emailSubscribers')
            } else {
                return await Site.find()
            }
        } catch (error) {
            return {
                status: 500,
                error: error?.message || JSON.stringify(error),
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
            return await Post.findById(id).populate('comments')
        } catch (error) {
            return {
                status: 500,
                error: error.message || JSON.stringify(error),
            }
        }
    }

    async getAccounts() {
        try {
            return await Account.find()
        } catch (error) {
            return {
                status: 500,
                error: error.message || JSON.stringify(error),
            }
        }
    }
}