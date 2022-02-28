import { Site } from '../persistance/models/site'
import { Post } from '../persistance/models/post'
import { Account } from '../persistance/models/account'
import { throwServerError } from '../utils/errorUtils'
import { Site as SiteType } from '../@types/data'
import { NotFound } from '@curveball/http-errors/dist'

export class ReadSiteService {

    async getSites(criteria = {}, skip = 0, limit = 10): Promise<SiteType[]> {
        let sites: SiteType[] | undefined
        try {
            sites = await Site.find({ criteria, inNetwork: true }, null, { sort: { 'updated_at': -1 }, skip, limit, }).exec()
        } catch (error: any) {
            throwServerError(error)
        }
        if (!sites)
            throw new NotFound(`No sites were found`)

        return sites
    }

    async getAllSites(populateSubs: boolean) {
        try {
            if (populateSubs) {
                return await Site.find().populate('phoneSubscribers').populate('emailSubscribers')
            } else {
                return await Site.find()
            }
        } catch (error: any) {
            throwServerError(error)
        }
    }

    async getOneSite(unique: string) {
        // Return latest 3 posts
        try {
            return await Site.findOne({ unique }).populate({
                path: 'posts',
                options: { limit: 3, sort: { 'updated_at': -1 } }
            })
        } catch (error: any) {
            throwServerError(error)
        }
    }

    async getSitePosts(id: string, skip = 0, limit = 10) {
        try {
            return await Post.find({ site: id }, null, { sort: { 'updated_at': -1 }, skip, limit, }).exec()
        } catch (error: any) {
            throwServerError(error)
        }
    }

    async getOnePost(id: string) {
        try {
            return await Post.findById(id).populate('comments')
        } catch (error: any) {
            throwServerError(error)
        }
    }

    async getAccounts() {
        try {
            return await Account.find()
        } catch (error: any) {
            throwServerError(error)
        }
    }
}