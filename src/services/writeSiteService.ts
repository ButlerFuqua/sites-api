import {
    Request as ExRequest,
} from "express";

import { uniqueNamesGenerator, starWars, colors } from 'unique-names-generator';
import { parsePhoneNumber } from 'libphonenumber-js'

import { Site } from "../persistance/models/site";
import { Post } from "../persistance/models/post";
import { Account } from "../persistance/models/account";
import { BlackListUnique } from "../persistance/models/blacklistUnique";
import { Command } from "../persistance/models/command";

require('../persistance')
import { SubscriberService } from './subscriberService'
import { Command as CommandType, } from "../@types/data";
import { throwServerError } from "../utils/errorUtils";
import { BadRequest, NotFound } from "@curveball/http-errors/dist";

export class WriteSiteService {

    private req: ExRequest | null
    private command: CommandType | null
    private messageData: string | null
    private updateSiteCommands: CommandType[]
    private availableCommands: CommandType[]
    private siteUrl: string
    private helpSiteUrl: string
    private subService: SubscriberService
    private blackListedUniques: string[]
    private readonly badCommandMessage: string

    constructor() {
        this.subService = new SubscriberService()

        this.siteUrl = process.env.SITE_URL || 'localhost:3000'
        this.helpSiteUrl = process.env.HELP_SITE_URL || `${this.siteUrl}/help`

        // Fetch commands
        let allCommands: any
        try {
            allCommands = Command.find()
        } catch (error: any) {
            throwServerError(error)
        }
        this.availableCommands = allCommands.map((cmd: CommandType) => cmd.name)
        this.updateSiteCommands = allCommands.filter((cmd: CommandType) => cmd.updateCommand).map((cmd: CommandType) => cmd.name)

        // Fetch blackListedUniques
        let allBlacklistUniques: any
        try {
            allBlacklistUniques = BlackListUnique.find()
        } catch (error: any) {
            throwServerError(error)
        }
        this.blackListedUniques = allBlacklistUniques.map((unique: any) => unique.name)

        this.badCommandMessage = `Command invalid or missing. Available commands:\n${this.availableCommands.join('\n')}`

        // data from request ( to make TS happy)
        this.req = null
        this.command = null
        this.messageData = null
    }


    async determineAction(req: ExRequest) {

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
            switch (this.command.name) {
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
        if (!this.req)
            throw new BadRequest(`isCreateSite() was given no request.`)
        // check if there is a site with the following number
        const parsedNumber = parsePhoneNumber(this.req.body.From, 'US')
        let foundSites: any
        try {
            foundSites = await Site.find({ phoneNumber: parsedNumber.number })
        } catch (error: any) {
            throwServerError(error)
        }
        // yes => false, no => true
        return foundSites.length < 1 // return true (isCreateSite), if there are no sites
    }
    async createSite() {
        if (!this.req)
            throw new BadRequest(`createSite) received no response.`)

        // Generate random site name
        const randomName = uniqueNamesGenerator({
            dictionaries: [colors, starWars],
            length: 2
        })

        const phoneNumber = parsePhoneNumber(this.req.body.From, 'US')

        const tempFromNum = phoneNumber.number.substring(6)

        const tempSiteName = `${randomName.trim().replace(/_/, '-').replace(/\s/g, '-')}-${tempFromNum}`

        // Make sure the unique name doesn't already exist
        let foundSites: any
        try {
            foundSites = await Site.find({ unique: tempSiteName.toLowerCase() })
        } catch (error: any) {
            throwServerError(error)
        }
        // It's unlikely to happen, especially twice, so ask to make the site again.
        if (foundSites?.length > 0)
            return `Sorry, there was a mistake creating your site. Can you send that message again?`

        // Get Free account as default
        let account
        try {
            account = await Account.findOne({ name: 'Free' })
        } catch (error: any) {
            throwServerError(error)
        }

        let newSite
        try {
            newSite = await Site.create({ phoneNumber: phoneNumber.number, unique: tempSiteName.toLowerCase(), account: account._id })
        } catch (error: any) {
            throwServerError(error)
        }

        if (!newSite)
            throw new NotFound(`Site with number ${this.req.body.From} was not found.`)

        return `Your site has been created!\nText "help" for how to update and post.\nVisit your site: ${this.siteUrl}/${newSite.unique}`

    }

    isCommand() {
        if (!this.req)
            throw new BadRequest(`isCommand() was given no request.`)

        const message = this.req.body.Body.trim().split(' ')
        if (this.availableCommands.includes(message[0].toLowerCase())) {
            const command = message[0].toLowerCase()
            this.messageData = this.req.body.Body.replace(message[0], '').trim()
            return command
        }
        else
            throw new BadRequest(this.badCommandMessage)
    }

    async updateSite() {
        if (!this.req)
            throw new BadRequest(`isCommand() was given no request.`)

        if (!this.command)
            throw new BadRequest(`No command was given to update site.`)

        if (!this.messageData)
            throw new BadRequest(`No messageData was given to update site.`)

        if (this.command.name === 'unique') {
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
            result = await Site.findOneAndUpdate({ phoneNumber: parsedNumber.number }, { [this.command.name]: this.messageData })
        } catch (error: any) {
            throwServerError(error)
        }

        if (!result)
            return `Sorry! Couldn't find for the number ${phoneNumber}`

        return `Update made! ${this.command} = ${this.messageData}`
    }

    async postToSite() {
        if (!this.req)
            throw new BadRequest(`postToSite() was given no request.`)

        const parsedNumber = parsePhoneNumber(this.req.body.From, 'US')
        // Get site
        let site
        try {
            site = await Site.findOne({ phoneNumber: parsedNumber.number })
        } catch (error: any) {
            throwServerError(error)
        }

        if (!site)
            return `Sorry, site not found for number ${this.req.body.From}`

        // Create post
        let newPost
        try {
            newPost = await Post.create({ body: this.messageData, site: site._id })
        } catch (error: any) {
            throwServerError(error)
        }

        // Save post ref to site
        site.posts = [...site.posts, newPost._id]
        try {
            await site.save()
        } catch (error: any) {
            // Delete post if there was an error
            try {
                await Post.findOneAndDelete({ _id: newPost._id })
            } catch (deletePostError: any) {
                throwServerError(deletePostError)
            }
            throwServerError(error)
        }

        return `You made a new post! View at:\n${this.siteUrl}/${site.unique}/posts/${newPost._id}`
    }

    async deletePost() {
        if (!this.req)
            throw new BadRequest(`deletePost() was given no request.`)

        // Get post id
        const postId = this.messageData

        // Get and delete post
        let post: any
        try {
            post = await Post.findOneAndDelete({ _id: postId })
        } catch (error: any) {
            throwServerError(error)
        }

        // Get site
        let site
        try {
            site = await Site.findOne({ phoneNumber: this.req.body.From })
        } catch (error: any) {
            throwServerError(error)
        }

        site.posts = site.posts.filter((pstId: any) => pstId.toString() !== post._id.toString())

        try {
            await site.save()
        } catch (error: any) {
            throwServerError(error)
        }

        return `Your post has been deleted.`

    }

    async signupSubscriber() {
        if (!this.req)
            throw new BadRequest(`signupSubscriber() was given no request.`)

        if (!this.messageData)
            throw new BadRequest(`signupSubscriber() was given no messageData.`)

        const result = await this.subService.signupPhoneSubscriber(this.req.body.From, this.messageData)
        if (!result)
            return `Sorry, something went wrong! Try again?`

        if (typeof result === 'string')
            return result

        if (result.error)
            return result.error


        return `Yay! You have a new subscriber: ${result.phoneNumber}`
    }

    async signdownSubscriber() {
        if (!this.req)
            throw new BadRequest(`signdownSubscriber() was given no request.`)

        if (!this.messageData)
            throw new BadRequest(`signdownSubscriber() was given no messageData.`)

        const result = await this.subService.signdownPhoneSubscriber(this.req.body.From, this.messageData)

        if (!result)
            return `Sorry, something went wrong! Try again?`

        if (typeof result === 'string')
            return result

        if (result.error)
            return result.error

        return `Unsubscribed: ${result.phoneNumber} ..It's okay. There are plenty of fish in the sea.`
    }

    async areYouSureDelete() {
        if (!this.req)
            throw new BadRequest(`areYouSureDelete() was given no request.`)

        // Get site and stage for deletion
        let site
        try {
            site = await Site.findOneAndUpdate({ phoneNumber: this.req.body.From }, { stagedForDeletion: true })
        } catch (error: any) {
            throwServerError(error)
        }

        return `Are you sure you want to delete your site?\nYou'll lose all your data, and there's no getting it back!\nTo delete respond with: cmd death ${site.unique}`
    }

    async forRealDelete() {
        if (!this.req)
            throw new BadRequest(`forRealDelete() was given no request.`)

        // Get site
        let site
        try {
            site = await Site.findOne({ phoneNumber: this.req.body.From })
        } catch (error: any) {
            throwServerError(error)
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
        } catch (error: any) {
            throwServerError(error)
        }

        // delete site
        try {
            await Site.findOneAndDelete({ phoneNumber: this.req.body.From })
            return `Sadly, your site has been deleted.\nJust text this number again to create a new site!`
        } catch (error: any) {
            throwServerError(error)
        }
    }

    sendHelp() {
        if (!this.messageData)
            throw new BadRequest(`sendHelp() was given no messageData.`)

        const data = (this.messageData).toLowerCase()

        if (data === 'commands' || data === 'command' || data === 'cmd' || data === 'cmds')
            return `Commands:\n${this.availableCommands.join('\n')}`

        return `Visit ${this.helpSiteUrl}/ for further help.`

    }

    updateAccount() {
        return `Visit this link to update your account: ${this.siteUrl}/account`
    }
}

