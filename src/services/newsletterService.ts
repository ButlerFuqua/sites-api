require('../persistance')
import { BadRequest } from "@curveball/http-errors/dist"
import { parsePhoneNumber, PhoneNumber } from "libphonenumber-js"
import { EmailSubscriber as EmailSubscriberType, PhoneSubscriber as PhoneSubscriberType } from "../@types/data"
import { throwServerError } from "../utils/errorUtils"

import { SubscriberService } from "./subscriberService"

export class NewsletterService {

    private subscriberService: SubscriberService
    private twilioClient: any
    private fromNumber: PhoneNumber
    private sgMail: any
    private siteUrl: any
    private fromEmailAddress: any

    constructor() {
        this.subscriberService = new SubscriberService()

        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        if (!accountSid || !authToken)
            throw new BadRequest(`Missing accountSid or authToken}`)

        this.twilioClient = require('twilio')(accountSid, authToken);
        let fromNumber = process.env.FROM_NEWSLETTER_NUMBER
        if (!fromNumber)
            throw new BadRequest(`Missing from number.`)

        this.fromNumber = parsePhoneNumber(fromNumber, 'US')

        this.siteUrl = process.env.SITE_URL || 'localhost:3000'

        this.sgMail = require('@sendgrid/mail')
        if (process.env.SENDGRID_API_KEY)
            this.sgMail.setApiKey(process.env.SENDGRID_API_KEY)
        else
            throw new BadRequest(`Missing sendgrid api key`)

        if (!process.env.FROM_NEWSLETTER_EMAIL)
            throw new BadRequest(`Missing from email`)
        this.fromEmailAddress = process.env.FROM_NEWSLETTER_EMAIL

    }

    async sendAllNewsletters() {

        // Get all subscribers
        const { phoneSubscribers, emailSubscribers } = await this.subscriberService.getAllSubscribers({ getSitesToo: true })

        // Send newsletters to each type of subscriber (phone and email)
        const [phoneResults, emailResults] = await Promise.all([
            ...phoneSubscribers.map(async (sub: PhoneSubscriberType) => await this.sendPhoneNewsletters(sub)),
            ...emailSubscribers.map(async (sub: EmailSubscriberType) => await this.sendEmailNewsletters(sub))
        ])

        // return results
        return { phoneResults, emailResults }
    }

    async sendPhoneNewsletters(sub: PhoneSubscriberType) {
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
                } catch (error: any) {
                    throwServerError(error)
                }
            })
        )
    }

    async sendEmailNewsletters(sub: EmailSubscriberType) {
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
                } catch (error: any) {
                    throwServerError(error)
                }
            })
        )
    }
}