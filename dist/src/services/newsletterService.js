"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewsletterService = void 0;
require('../persistance');
const dist_1 = require("@curveball/http-errors/dist");
const libphonenumber_js_1 = require("libphonenumber-js");
const errorUtils_1 = require("../utils/errorUtils");
const subscriberService_1 = require("./subscriberService");
class NewsletterService {
    constructor() {
        this.subscriberService = new subscriberService_1.SubscriberService();
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        if (!accountSid || !authToken)
            throw new dist_1.BadRequest(`Missing accountSid or authToken}`);
        this.twilioClient = require('twilio')(accountSid, authToken);
        let fromNumber = process.env.FROM_NEWSLETTER_NUMBER;
        if (!fromNumber)
            throw new dist_1.BadRequest(`Missing from number.`);
        this.fromNumber = (0, libphonenumber_js_1.parsePhoneNumber)(fromNumber, 'US');
        this.siteUrl = process.env.SITE_URL || 'localhost:3000';
        this.sgMail = require('@sendgrid/mail');
        if (process.env.SENDGRID_API_KEY)
            this.sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        else
            throw new dist_1.BadRequest(`Missing sendgrid api key`);
        if (!process.env.FROM_NEWSLETTER_EMAIL)
            throw new dist_1.BadRequest(`Missing from email`);
        this.fromEmailAddress = process.env.FROM_NEWSLETTER_EMAIL;
    }
    sendAllNewsletters() {
        return __awaiter(this, void 0, void 0, function* () {
            // Get all subscribers
            const { phoneSubscribers, emailSubscribers } = yield this.subscriberService.getAllSubscribers({ getSitesToo: true });
            // Send newsletters to each type of subscriber (phone and email)
            const [phoneResults, emailResults] = yield Promise.all([
                ...phoneSubscribers.map((sub) => __awaiter(this, void 0, void 0, function* () { return yield this.sendPhoneNewsletters(sub); })),
                ...emailSubscribers.map((sub) => __awaiter(this, void 0, void 0, function* () { return yield this.sendEmailNewsletters(sub); }))
            ]);
            // return results
            return { phoneResults, emailResults };
        });
    }
    sendPhoneNewsletters(sub) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Promise.all(sub.sites.map((site) => __awaiter(this, void 0, void 0, function* () {
                let parsedToNumber = (0, libphonenumber_js_1.parsePhoneNumber)(sub.phoneNumber, 'US');
                try {
                    const message = `Check out recent posts from ${site.title || site.unique}!\n${this.siteUrl}/${site.unique}/posts`;
                    if (process.env.ENV !== 'dev') {
                        return yield this.twilioClient.messages.create({
                            body: message,
                            from: this.fromNumber.number,
                            to: parsedToNumber.number
                        });
                    }
                    else {
                        return message;
                    }
                }
                catch (error) {
                    (0, errorUtils_1.throwServerError)(error);
                }
            })));
        });
    }
    sendEmailNewsletters(sub) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Promise.all(sub.sites.map((site) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const html = `
                    <h1>${site.title || site.unique} newsletter</h1>
                    <p>Check out this week's latest posts!</p>
                    <a href="${this.siteUrl}/${site.unique}/posts">View posts</a>
                    <p>Copy and paste the below url if the link above doesn't work:</p>
                    <p>${this.siteUrl}/${site.unique}/posts</p>
                `;
                    if (process.env.ENV !== 'dev') {
                        const msg = {
                            to: sub.email,
                            from: this.fromEmailAddress,
                            subject: `${site.title || site.unique} newsletter`,
                            html,
                        };
                        return yield this.sgMail.send(msg);
                    }
                    else {
                        return html;
                    }
                }
                catch (error) {
                    (0, errorUtils_1.throwServerError)(error);
                }
            })));
        });
    }
}
exports.NewsletterService = NewsletterService;
