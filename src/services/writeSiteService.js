const { uniqueNamesGenerator, starWars, colors } = require('unique-names-generator');
const { parsePhoneNumber } = require('libphonenumber-js')

const Site = require('../persistence/models/site')
const Post = require('../persistence/models/post')
require('../persistence')
const SubScriberService = require('./subscriberService')

module.exports = class WriteSiteService {

    req
    command
    messageData
    updateSiteCommands
    postCommands
    availableCommands
    siteUrl
    helpSiteUrl
    subService

    constructor() {

        this.subService = new SubScriberService()

        this.siteUrl = process.env.SITE_URL || 'localhost:5500'
        this.helpSiteUrl = process.env.HELP_SITE_URL || `${this.siteUrl}/help`

        this.updateSiteCommands = [
            'title',
            'unique',
            'owner',
            'about',
            'support',
        ]
        this.postCommands = [
            'post',
            'remove',
        ]
        this.availableCommands = [
            ...this.updateSiteCommands,
            'delete',
            'death',
            'account',
            'help',
            'up',
            'down',
            ...this.postCommands,
        ]
    }

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

            switch (this.command) {
                case 'post':
                    return await this.postToSite()
                case 'remove':
                    return await this.deletePost()
                case 'up':
                    return await this.signupSubscriber()
                case 'down':
                    return await this.signdownSubscriber()
                case 'delete':
                    return await this.areYouSureDelete()
                case 'death':
                    return await this.forRealDelete()
                case 'help':
                    return this.sendHelp()
                default:
                    break;
            }

            // Update site
            if (this.updateSiteCommands.includes(this.command))
                return await this.updateSite()
        }

        // Send list of commands

        return false

    }

    async isCreateSite() {
        // check if there is a site with the following number
        const parsedNumber = parsePhoneNumber(this.req.body.From, 'US')
        let foundSites
        try {
            foundSites = await Site.find({ phoneNumber: parsedNumber.number })
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

        const phoneNumber = parsePhoneNumber(this.req.body.From, 'US')

        const tempFromNum = phoneNumber.number.substring(6)

        const tempSiteName = `${randomName.trim().replace(/_/, '-').replace(/\s/g, '-')}-${tempFromNum}`

        // Make sure the unique name doesn't already exist
        let foundSites
        try {
            foundSites = await Site.find({ unique: tempSiteName.toLowerCase() })
        } catch (error) {
            return handle500Error(error)
        }
        // It's unlikely to happen, especially twice, so ask to make the site again.
        if (foundSites.length > 0)
            return `Sorry, there was a mistake creating your site. Can you send that message again?`

        let newSite
        try {
            newSite = await Site.create({ phoneNumber: phoneNumber.number, unique: tempSiteName.toLowerCase() })
        } catch (error) {
            return handle500Error(error)
        }

        if (!newSite)
            return handle500Error(error)

        return `Your site has been created!\nText "cmd help" for how to update and post.\nVisit your site: ${this.siteUrl}/${newSite.unique}`

    }

    isCommand() {
        const message = this.req.body.Body.trim().split(' ')
        if (message[0].toLowerCase() === 'cmd') {
            // check that the command exists and is available
            if (message[1] && this.availableCommands.includes(message[1].toLowerCase())) {
                const command = message[1].toLowerCase()
                this.messageData = this.req.body.Body.replace(/cmd/i, '').replace(command, '').trim()
                return command
            }
            else return {
                error: `Command invalid or missing. Available commands:\n${this.availableCommands.join('\n')}`,
                status: 400
            }
        }
        return false
    }

    async updateSite() {

        if (this.command === 'unique')
            this.messageData = this.messageData.toLowerCase().replace(/\s/g, '-')

        // update site
        try {
            await Site.findOneAndUpdate({ phoneNumber: this.req.body.From }, { [this.command]: this.messageData })
        } catch (error) {
            return handle500Error(error)
        }

        return `Update made! ${this.command} = ${this.messageData}`
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
            newPost = await Post.create({ body: this.messageData, site: site._id })
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

        return `You made a new post! View at:\n${this.siteUrl}/${site.unique}/${newPost._id}`
    }

    async deletePost() {

        // Get post id
        const postId = this.messageData

        // Get and delete post
        let post
        try {
            post = await Post.findOneAndDelete({ _id: postId })
        } catch (error) {
            return handle500Error(error)
        }

        // Get site
        let site
        try {
            site = await Site.findOne({ phoneNumber: this.req.body.From })
        } catch (error) {
            return handle500Error(error)
        }

        site.posts = site.posts.filter(pstId => pstId.toString() !== post._id.toString())

        try {
            await site.save()
        } catch (error) {
            return handle500Error(error)
        }

        return `Your post has been deleted.`

    }

    async signupSubscriber() {
        const result = await this.subService.signup(this.req.body.From, this.messageData)
        if (!result)
            return `Sorry, something went wrong! Try again?`

        if (typeof result === 'string')
            return result

        if (result.error)
            return result.error


        return `Yay! You have a new subscriber: ${result.phoneNumber}`
    }

    async signdownSubscriber() {
        const result = await this.subService.signdown(this.req.body.From, this.messageData)

        if (!result)
            return `Sorry, something went wrong! Try again?`

        if (typeof result === 'string')
            return result

        if (result.error)
            return result.error

        return `Unsubscribed: ${result.phoneNumber} ..It's okay. There are plenty of fish in the sea.`
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
        const confirmation = this.messageData
        if (confirmation !== site.unique)
            return `Yay! You entered the command in wrong.\nTo permanently delete, send EXACTLY:\ncmd death ${site.unique}`

        // Delete all posts by site
        try {
            await Post.deleteMany({ site: site._id })
        } catch (error) {
            return handle500Error(error)
        }

        // delete site
        try {
            await Site.findOneAndDelete({ phoneNumber: this.req.body.From })
            return `Sadly, your site has been deleted.\nJust text this number again to create a new site!`
        } catch (error) {
            return handle500Error(error)
        }
    }

    sendHelp() {
        const data = (this.messageData).toLowerCase()

        if (data === 'commands' || data === 'command' || data === 'cmd' || data === 'cmds')
            return `Commands:\n${this.availableCommands.join('\n')}`

        return `Visit ${this.helpSiteUrl}/ for further help.`

    }
}

function handle500Error(error) {
    return {
        status: 500,
        error: error.message || JSON.stringify(error),
    }
}