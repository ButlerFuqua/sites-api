const { uniqueNamesGenerator, starWars, colors } = require('unique-names-generator');


const Site = require('../persistence/models/site')
const Post = require('../persistence/models/post')
require('../persistence')

module.exports = class SiteService {

    req
    command
    updateSiteCommands = [
        'title',
        'unique',
        'owner',
        'about',
        'support',
    ]
    postCommands = [
        'post',
    ]
    availableCommands = [
        ...this.updateSiteCommands,
        'delete',
        'death',
        'account',
        ...this.postCommands,
    ]

    async determineAction(req) {

        /*
         * Possible actions 
         */

        this.req = req

        // Create a new site
        if (await this.isCreateSite())
            return await this.createSite()


        // Is it a command
        this.command = this.isCommand()
        if (this.command) {
            // Error
            if (this.command.error) return this.command

            // Post to site
            if (this.postCommands.includes(this.command))
                return await this.postToSite()

            // Update site
            if (this.updateSiteCommands.includes(this.command))
                return await this.updateSite()

            // Are you sure delete
            if (this.command === 'delete')
                return await this.areYouSureDelete()

            // For real delete
            if (this.command === 'death')
                return await this.forRealDelete()

        }

        // Delete an existing site
        // Post to site
        // Delete a Post
        // Send list of commands

        return false

    }

    async isCreateSite() {
        // check if there is a site with the following number
        let foundSites
        try {
            foundSites = await Site.find({ phoneNumber: this.req.body.From })
        } catch (error) {
            return handle500Error(error)
        }
        // yes => false, no => true
        return foundSites.length < 1 // return true (isCreateSite), if there are no sites
    }
    async createSite() {

        // Generate random site name
        const randomName = uniqueNamesGenerator({
            dictionaries: [colors, starWars],
            length: 2
        })

        const phoneNumber = this.req.body.From

        const tempFromNum = phoneNumber.substring(6)

        const tempSiteName = `${randomName.trim().replace(/_/, '-').replace(/\s/g, '-')}-${tempFromNum}`

        let newSite
        try {
            newSite = await Site.create({ phoneNumber, unique: tempSiteName.toLowerCase() })
        } catch (error) {
            return handle500Error(error)
        }

        if (!newSite)
            return handle500Error(error)

        return `Your site has been created!\nText HELP for how to update and post.\nVisit your site: wwww.site.com/${newSite.unique}`

    }

    isCommand() {
        const message = this.req.body.Body.trim().split(' ')
        if (message[0].toLowerCase() === 'cmd') {
            // check that the command exists and is available
            if (message[1] && this.availableCommands.includes(message[1].toLowerCase()))
                return message[1].toLowerCase()
            else return {
                error: `Command invalid or missing. Available commands:\n${this.availableCommands.join('\n')}`,
                status: 400
            }
        }
        return false
    }

    async updateSite() {

        // get data to insert
        const data = this.getDataToInsert()

        // update site
        let site
        try {
            site = await Site.findOneAndUpdate({ phoneNumber: this.req.body.From }, { [this.command]: data })
        } catch (error) {
            return handle500Error(error)
        }

        return { ...site._doc, [this.command]: data }
    }

    async postToSite() {

        // Get site
        let site
        try {
            site = await Site.findOne({ phoneNumber: this.req.body.From })
        } catch (error) {
            return handle500Error(error)
        }

        // Create post
        let newPost
        try {
            newPost = await Post.create({ body: this.getDataToInsert(), site: site._id })
        } catch (error) {
            return handle500Error(error)
        }

        // Save post ref to site
        site.posts = [...site.posts, newPost._id]
        try {
            await site.save()
        } catch (error) {
            // Delete post if there was an error
            try {
                await Post.findOneAndDelete({ _id: newPost._id })
            } catch (deletePostError) {
                return handle500Error(deletePostError)
            }
            return handle500Error(error)
        }

        return `You made a new post! View at:\nwww.site.com/${site.unique}/${newPost._id}`
    }

    async areYouSureDelete() {
        // Get site and stage for deletion
        let site
        try {
            site = await Site.findOneAndUpdate({ phoneNumber: this.req.body.From }, { stagedForDeletion: true })
        } catch (error) {
            return handle500Error(error)
        }

        return `Are you sure you want to delete your site?\nYou'll lose all your data, and there's no getting it back!\nTo delete respond with: cmd death ${site.unique}`

    }

    async forRealDelete() {
        // Get site
        let site
        try {
            site = await Site.findOne({ phoneNumber: this.req.body.From })
        } catch (error) {
            return handle500Error(error)
        }

        // check for staged for deletion
        if (!site.stagedForDeletion)
            return this.areYouSureDelete()

        // Check for delete confirmation
        const confirmation = this.getDataToInsert()
        if (confirmation !== site.unique)
            return `Yay! You entered the command in wrong.\nTo permanently delete, send EXACTLY:\n cmd death ${site.unique}`

        // delete site
        try {
            await Site.findOneAndDelete({ phoneNumber: this.req.body.From })
            return `Sadly, your site has been deleted.\nJust text this number again to create a new site!`
        } catch (error) {
            return handle500Error(error)
        }
    }

    getDataToInsert() {
        return this.req.body.Body.replace(/cmd/i, '').replace(this.command, '').trim()
    }
}

function handle500Error(error) {
    return {
        status: 500,
        error: error.message || JSON.stringify(error),
    }
}