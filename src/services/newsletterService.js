require('../persistence')
const { parsePhoneNumber } = require('libphonenumber-js')


const SiteService = require('./readSiteService')
const SubScriberService = require('./subscriberService')


module.exports = class CommentService {

    siteService
    subscriberService
    twilioClient
    fromNumber
    sgMail
    siteUrl
    fromEmailAddress

    constructor() {
        this.siteService = new SiteService()
        this.subscriberService = new SubScriberService()

        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        if (!accountSid || !authToken)
            throw new Error(`Missing accountSid or authToken}`)

        this.twilioClient = require('twilio')(accountSid, authToken);
        let fromNumber = process.env.FROM_NEWSLETTER_NUMBER
        if (!fromNumber)
            throw new Error(`Missing from number.`)

        this.fromNumber = parsePhoneNumber(fromNumber, 'US')

        this.siteUrl = process.env.SITE_URL || 'localhost:3000'

        this.sgMail = require('@sendgrid/mail')
        if (process.env.SENDGRID_API_KEY)
            this.sgMail.setApiKey(process.env.SENDGRID_API_KEY)
        else
            throw new Error(`Missing sendgrid api key`)

        if (!process.env.FROM_NEWSLETTER_EMAIL)
            throw new Error(`Missing from email`)
        this.fromEmailAddress = process.env.FROM_NEWSLETTER_EMAIL

    }

    async sendAllNewsletters() {

        // Get all subscribers
        const { phoneSubscribers, emailSubscribers } = await this.subscriberService.getAllSubscribers({ getSitesToo: true })

        // Send newsletters to each type of subscriber (phone and email)
        const [phoneResults, emailResults] = await Promise.all([
            ...phoneSubscribers.map(async sub => await this.sendPhoneNewsletters(sub)),
            ...emailSubscribers.map(async sub => await this.sendEmailNewsletters(sub))
        ])

        // return results
        return {
            status: 200,
            results: { phoneResults, emailResults }
        }
    }

    async sendPhoneNewsletters(sub) {
        return await Promise.all(
            sub.sites.map(async site => {
                let parsedToNumber = parsePhoneNumber(sub.phoneNumber, 'US')
                try {
                    const message = `Check out recent posts from ${site.title || site.unique}!\n${this.siteUrl}/${site.unique}/posts`
                    if (process.env.ENV !== 'dev') {
                        return await this.twilioClient.messages.create({
                            body: message,
                            from: this.fromNumber.number,
                            to: parsedToNumber.number
                        })
                    } else {
                        return message
                    }
                } catch (error) {
                    return handle500Error(error)
                }
            })
        )
    }

    async sendEmailNewsletters(sub) {
        return await Promise.all(
            sub.sites.map(async site => {
                try {
                    const html = `
                    <h1>${site.title || site.unique} newsletter</h1>
                    <p>Check out this week's latest posts!</p>
                    <a href="${this.siteUrl}/${site.unique}/posts">View posts</a>
                    <p>Copy and paste the below url if the link above doesn't work:</p>
                    <p>${this.siteUrl}/${site.unique}/posts</p>
                `
                    if (process.env.ENV !== 'dev') {
                        const msg = {
                            to: sub.email, // Change to your recipient
                            from: this.fromEmailAddress, // Change to your verified sender
                            subject: `${site.title || site.unique} newsletter`,
                            html,
                        }
                        return await this.sgMail.send(msg)

                    } else {
                        return html
                    }
                } catch (error) {
                    return handle500Error(error)
                }
            })
        )
    }


}


function handle500Error(error) {
    return {
        status: 500,
        error: error.message || JSON.stringify(error),
    }
}