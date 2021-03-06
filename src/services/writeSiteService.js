const { uniqueNamesGenerator, starWars, colors } = require('unique-names-generator');
const { parsePhoneNumber } = require('libphonenumber-js')

const Site = require('../persistence/models/site')
const Post = require('../persistence/models/post')
const Command = require('../persistence/models/command')
require('../persistence')
const SubScriberService = require('./subscriberService')

const Account = require('../persistence/models/account');
const BlackListUnique = require('../persistence/models/blacklistUnique');

module.exports = class WriteSiteService {

    req
    command
    messageData
    updateSiteCommands
    availableCommands
    siteUrl
    helpSiteUrl
    subService
    blackListedUniques

    constructor() {
        this.init()
    }

    async init() {
        this.subService = new SubScriberService()

        this.siteUrl = process.env.SITE_URL || 'localhost:3000'
        this.helpSiteUrl = process.env.HELP_SITE_URL || `${this.siteUrl}/help`


        await this.fetchCommands()
        await this.fetchBlacklistUniques()
    }

    async fetchCommands() {
        let allCommands
        try {
            allCommands = await Command.find()
        } catch (error) {
            return handle500Error(error)
        }
        this.availableCommands = allCommands.map(cmd => cmd.name)
        this.updateSiteCommands = allCommands.filter(cmd => cmd.updateCommand).map(cmd => cmd.name)

    }
    async fetchBlacklistUniques() {
        let allBlacklistUniques
        try {
            allBlacklistUniques = await BlackListUnique.find()
        } catch (error) {
            return handle500Error(error)
        }
        this.blackListedUniques = allBlacklistUniques.map(unique => unique.name)

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
                case 'account':
                    return this.updateAccount()
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

        // Get Free account as default
        let account
        try {
            account = await Account.findOne({ name: 'Free' })
        } catch (error) {
            return handle500Error(errror)
        }

        let newSite
        try {
            newSite = await Site.create({ phoneNumber: phoneNumber.number, unique: tempSiteName.toLowerCase(), account: account._id })
        } catch (error) {
            return handle500Error(error)
        }

        if (!newSite)
            return handle500Error(error)

        return `Your site has been created!\nText "help" for how to update and post.\nVisit your site: ${this.siteUrl}/${newSite.unique}`

    }

    isCommand() {
        const message = this.req.body.Body.trim().split(' ')
        if (this.availableCommands.includes(message[0].toLowerCase())) {
            const command = message[0].toLowerCase()
            this.messageData = this.req.body.Body.replace(message[0], '').trim()
            return command
        }
        else return {
            error: `Command invalid or missing. Available commands:\n${this.availableCommands.join('\n')}`,
            status: 400
        }
    }

    async updateSite() {

        if (this.command === 'unique') {
            const unique = this.messageData.toLowerCase().replace(/-/g, '').replace(/_/g, '').replace(/\s/g, '')
            if (this.blackListedUniques.includes(unique))
                return `Sorry, ${this.messageData} is not available as a unique name.`
            this.messageData = this.messageData.toLowerCase().replace(/\s/g, '-')
        }

        // parse number
        const phoneNumber = this.req.body.From
        const parsedNumber = parsePhoneNumber(phoneNumber, 'US')

        // update site
        let result
        try {
            result = await Site.findOneAndUpdate({ phoneNumber: parsedNumber.number }, { [this.command]: this.messageData })
        } catch (error) {
            return handle500Error(error)
        }

        if (!result)
            return `Sorry! Couldn't find for the number ${phoneNumber}`

        return `Update made! ${this.command} = ${this.messageData}`
    }

    async postToSite() {
        const parsedNumber = parsePhoneNumber(this.req.body.From, 'US')
        // Get site
        let site
        try {
            site = await Site.findOne({ phoneNumber: parsedNumber.number })
        } catch (error) {
            return handle500Error(error)
        }

        if (!site)
            return `Sorry, site not found for number ${this.req.body.From}`

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

        return `You made a new post! View at:\n${this.siteUrl}/${site.unique}/posts/${newPost._id}`
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

    updateAccount() {
        return `Visit this link to update your account: ${this.siteUrl}/account`
    }
}

function handle500Error(error) {
    return {
        status: 500,
        error: error.message || JSON.stringify(error),
    }
}