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
exports.SubscriberService = void 0;
const dist_1 = require("@curveball/http-errors/dist");
const errorUtils_1 = require("../utils/errorUtils");
const site_1 = require("../persistance/models/site");
const phoneSubscriber_1 = require("../persistance/models/phoneSubscriber");
const emailSubscriber_1 = require("../persistance/models/emailSubscriber");
const libphonenumber_js_1 = require("libphonenumber-js");
const account_1 = require("../persistance/models/account");
class SubscriberService {
    getAllSubscribers(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const { getSitesToo } = options;
            // get all phoneSubscribers
            let phoneSubscribers;
            try {
                if (getSitesToo)
                    phoneSubscribers = yield phoneSubscriber_1.PhoneSubscriber.find().populate('sites', 'unique');
                else
                    phoneSubscribers = yield phoneSubscriber_1.PhoneSubscriber.find();
            }
            catch (error) {
                return (0, errorUtils_1.throwServerError)(error);
            }
            // get all emailSubscribers
            let emailSubscribers;
            try {
                if (getSitesToo)
                    emailSubscribers = yield emailSubscriber_1.EmailSubscriber.find().populate('sites', 'unique');
                else
                    emailSubscribers = yield emailSubscriber_1.EmailSubscriber.find();
            }
            catch (error) {
                return (0, errorUtils_1.throwServerError)(error);
            }
            return { phoneSubscribers, emailSubscribers };
        });
    }
    signupFromSite(siteId, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const { email, phoneNumber } = options;
            if (!email && !phoneNumber)
                return {
                    status: 400,
                    error: `No email or phone number.`
                };
            // Validate phone
            let parsedSubNumber;
            let subPhoneNumber;
            if (phoneNumber) {
                parsedSubNumber = (0, libphonenumber_js_1.parsePhoneNumber)(phoneNumber, 'US');
                if (!parsedSubNumber.isValid())
                    return {
                        status: 400,
                        error: `Not a valid US number: ${phoneNumber}`
                    };
                subPhoneNumber = parsedSubNumber.number;
            }
            // Validate email
            if (email) {
                const regex = RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
                if (!regex.test(email))
                    return {
                        status: 400,
                        error: `Not a valid email: ${email}`
                    };
            }
            // Get site and current subscribers
            let site;
            try {
                site = yield site_1.Site.findById(siteId).populate('phoneSubscribers').populate('emailSubscribers');
            }
            catch (error) {
                (0, errorUtils_1.throwServerError)(error);
            }
            if (!site)
                throw new dist_1.BadRequest(`Site not found with ID: ${siteId}`);
            // save/create subscribers and return value
            let phoneSubscriber, emailSubscriber;
            if (subPhoneNumber) {
                [phoneSubscriber, emailSubscriber] = yield Promise.all([
                    this.signupPhoneSubscriber(site, subPhoneNumber.toString()),
                    this.signupEmailSubscriber(site, email === null || email === void 0 ? void 0 : email.toLowerCase()),
                ]);
            }
            else {
                [emailSubscriber] = yield Promise.all([
                    this.signupEmailSubscriber(site, email === null || email === void 0 ? void 0 : email.toLowerCase()),
                ]);
            }
            if ((phoneSubscriber === null || phoneSubscriber === void 0 ? void 0 : phoneSubscriber.error) || (emailSubscriber === null || emailSubscriber === void 0 ? void 0 : emailSubscriber.error))
                return phoneSubscriber || emailSubscriber;
            // Update site
            if (phoneSubscriber)
                site.phoneSubscribers = [...site.phoneSubscribers, phoneSubscriber._id];
            if (emailSubscriber)
                site.emailSubscribers = [...site.emailSubscribers, emailSubscriber._id];
            try {
                yield site.save();
            }
            catch (error) {
                (0, errorUtils_1.throwServerError)(error);
            }
            return {
                status: 200,
                phone: phoneSubscriber,
                email: emailSubscriber,
            };
        });
    }
    signupPhoneSubscriber(site, subPhoneNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!subPhoneNumber)
                return null;
            // Check that user has not already subscribed to the site
            let alreadySubscribedByPhone;
            if (site.phoneSubscribers) {
                alreadySubscribedByPhone = site.phoneSubscribers.filter(sub => sub.phoneNumber).map(sub => (0, libphonenumber_js_1.parsePhoneNumber)(sub.phoneNumber, 'US')).find(sub => sub.number === subPhoneNumber);
            }
            // Return if both are subscribed
            if (alreadySubscribedByPhone)
                return null;
            // Make sure account allows another subscription
            const allowMore = yield this.doesAccountAllowMoreSubs(site);
            if (!allowMore)
                throw new dist_1.BadRequest(`Account does not allow any more subscribers.`);
            // check if it already exists
            let subscriberPhone;
            try {
                subscriberPhone = yield phoneSubscriber_1.PhoneSubscriber.findOne({ phoneNumber: subPhoneNumber });
            }
            catch (error) {
                (0, errorUtils_1.throwServerError)(error);
            }
            if (subscriberPhone) {
                // Associate site to subscriber
                try {
                    subscriberPhone.sites = [...subscriberPhone.sites, site._id];
                    yield subscriberPhone.save();
                }
                catch (error) {
                    (0, errorUtils_1.throwServerError)(error);
                }
            }
            else {
                // Create new subscriber
                try {
                    subscriberPhone = yield phoneSubscriber_1.PhoneSubscriber.create({
                        phoneNumber: subPhoneNumber,
                        sites: [site._id]
                    });
                }
                catch (error) {
                    (0, errorUtils_1.throwServerError)(error);
                }
            }
            return subscriberPhone;
        });
    }
    signupEmailSubscriber(site, email) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!email)
                return null;
            // Check that user has not already subscribed to the site
            let alreadySubscribedByEmail;
            if (site.emailSubscribers) {
                alreadySubscribedByEmail = site.emailSubscribers.find(sub => sub.email === email);
            }
            // Return if both are subscribed
            if (alreadySubscribedByEmail)
                return null;
            // Make sure account allows another subscription
            const allowMore = yield this.doesAccountAllowMoreSubs(site);
            if (!allowMore)
                throw new dist_1.BadRequest(`Account does not allow any more subscribers.`);
            // check if it already exists
            let subscriberEmail;
            try {
                subscriberEmail = yield emailSubscriber_1.EmailSubscriber.findOne({ email });
            }
            catch (error) {
                (0, errorUtils_1.throwServerError)(error);
            }
            if (subscriberEmail) {
                try {
                    subscriberEmail.sites = [...subscriberEmail.sites, site._id];
                    yield subscriberEmail.save();
                }
                catch (error) {
                    (0, errorUtils_1.throwServerError)(error);
                }
            }
            else {
                // Create new subscriber
                try {
                    subscriberEmail = yield emailSubscriber_1.EmailSubscriber.create({
                        email,
                        sites: [site._id]
                    });
                }
                catch (error) {
                    (0, errorUtils_1.throwServerError)(error);
                }
            }
            return subscriberEmail;
        });
    }
    doesAccountAllowMoreSubs(site) {
        return __awaiter(this, void 0, void 0, function* () {
            // Make sure account allows another subscription
            let account;
            try {
                account = yield account_1.Account.findById(site.account);
            }
            catch (error) {
                (0, errorUtils_1.throwServerError)(error);
            }
            let currentSubCount = 0;
            if (site.phoneSubscribers) {
                currentSubCount += site.phoneSubscribers.length;
            }
            if (site.emailSubscribers) {
                currentSubCount += site.emailSubscribers.length;
            }
            const subFeature = account.features.find((feature) => feature.name === 'Subscribers');
            return currentSubCount < subFeature.max;
        });
    }
    signdownFromSite(siteId, options) {
        return __awaiter(this, void 0, void 0, function* () {
            // TODO come up with some sort of auth, maybe a token.
            const { email, phone: phoneNumber } = options;
            if (!email && !phoneNumber)
                throw new dist_1.BadRequest(`No email or phone number.`);
            // Validate phone
            let parsedSubNumber;
            let subPhoneNumber;
            if (phoneNumber) {
                parsedSubNumber = (0, libphonenumber_js_1.parsePhoneNumber)(phoneNumber, 'US');
                if (!parsedSubNumber.isValid())
                    throw new dist_1.BadRequest(`Not a valid US number: ${phoneNumber}`);
                subPhoneNumber = parsedSubNumber.number;
            }
            // Validate email
            if (email) {
                const regex = RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
                if (!regex.test(email))
                    throw new dist_1.BadRequest(`Not a valid email: ${email}`);
            }
            // Get site and current subscribers
            let site;
            try {
                site = yield site_1.Site.findById(siteId).populate('phoneSubscribers').populate('emailSubscribers');
            }
            catch (error) {
                (0, errorUtils_1.throwServerError)(error);
            }
            if (!site)
                throw new dist_1.NotFound(`Site not found, ID: ${siteId}`);
            // save/create subscribers and return value
            let phoneSubscriber, emailSubscriber;
            if (subPhoneNumber) {
                [phoneSubscriber, emailSubscriber] = yield Promise.all([
                    this.signdownPhoneSubscriber(site, subPhoneNumber.toString()),
                    this.signdownEmailSubscriber(site, email === null || email === void 0 ? void 0 : email.toLowerCase()),
                ]);
            }
            else {
                [emailSubscriber] = yield Promise.all([
                    this.signdownEmailSubscriber(site, email === null || email === void 0 ? void 0 : email.toLowerCase()),
                ]);
            }
            // Create errors array to push
            let errors = [];
            if (phoneSubscriber === null || phoneSubscriber === void 0 ? void 0 : phoneSubscriber.error)
                errors.push(phoneSubscriber.error);
            if (emailSubscriber === null || emailSubscriber === void 0 ? void 0 : emailSubscriber.error)
                errors.push(emailSubscriber.error);
            // Update site
            if (phoneSubscriber && !(phoneSubscriber === null || phoneSubscriber === void 0 ? void 0 : phoneSubscriber.error))
                site.phoneSubscribers = site.phoneSubscribers.filter((sub) => sub._id.toString() !== phoneSubscriber._id.toString());
            if (emailSubscriber && !(emailSubscriber === null || emailSubscriber === void 0 ? void 0 : emailSubscriber.error))
                site.emailSubscribers = site.emailSubscribers.filter((sub) => sub._id.toString() !== emailSubscriber._id.toString());
            try {
                yield site.save();
            }
            catch (error) {
                (0, errorUtils_1.throwServerError)(error);
            }
            return {
                status: 200,
                phone: subPhoneNumber && !(phoneSubscriber === null || phoneSubscriber === void 0 ? void 0 : phoneSubscriber.error) ? `Unsubscribed ${subPhoneNumber}` : null,
                email: email && !(emailSubscriber === null || emailSubscriber === void 0 ? void 0 : emailSubscriber.error) ? `Unsubscribed ${email}` : null,
                errors,
            };
        });
    }
    signdownPhoneSubscriber(site, subPhoneNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!subPhoneNumber)
                return null;
            // Get subscriber
            let subscriber;
            try {
                subscriber = yield phoneSubscriber_1.PhoneSubscriber.findOne({ phoneNumber: subPhoneNumber });
            }
            catch (error) {
                (0, errorUtils_1.throwServerError)(error);
            }
            if (!subscriber)
                throw new dist_1.BadRequest(`Phone subscriber not found: ${subPhoneNumber}`);
            // Remove site from sites
            subscriber.sites = subscriber.sites.filter((subbedSite) => subbedSite._id.toString() !== site._id.toString());
            // decide to update or delete
            if (subscriber.sites.length < 1) {
                try {
                    yield phoneSubscriber_1.PhoneSubscriber.findByIdAndDelete(subscriber._id);
                }
                catch (error) {
                    (0, errorUtils_1.throwServerError)(error);
                }
            }
            else {
                try {
                    yield subscriber.save();
                }
                catch (error) {
                    (0, errorUtils_1.throwServerError)(error);
                }
            }
            return subscriber;
        });
    }
    signdownEmailSubscriber(site, email) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!email)
                return null;
            // Get subscriber
            let subscriber;
            try {
                subscriber = yield emailSubscriber_1.EmailSubscriber.findOne({ email });
            }
            catch (error) {
                (0, errorUtils_1.throwServerError)(error);
            }
            if (!subscriber)
                return {
                    status: 404,
                    error: `Email subscriber not found: ${email}`
                };
            // Remove site from sites
            subscriber.sites = subscriber.sites.filter((subbedSite) => subbedSite._id.toString() !== site._id.toString());
            // decide to update or delete
            if (subscriber.sites.length < 1) {
                try {
                    yield emailSubscriber_1.EmailSubscriber.findByIdAndDelete(subscriber._id);
                }
                catch (error) {
                    (0, errorUtils_1.throwServerError)(error);
                }
            }
            else {
                try {
                    yield subscriber.save();
                }
                catch (error) {
                    (0, errorUtils_1.throwServerError)(error);
                }
            }
            return subscriber;
        });
    }
    deleteFloatingSubscribers() {
        return __awaiter(this, void 0, void 0, function* () {
            // TODO - delete all subscribers that have no existing site
        });
    }
    getSiteSubscribers(id) {
        return __awaiter(this, void 0, void 0, function* () {
            let phoneSubscribers;
            try {
                phoneSubscribers = yield phoneSubscriber_1.PhoneSubscriber.find({ site: id });
            }
            catch (error) {
                (0, errorUtils_1.throwServerError)(error);
            }
            let emailSubscribers;
            try {
                emailSubscribers = yield emailSubscriber_1.EmailSubscriber.find({ site: id });
            }
            catch (error) {
                (0, errorUtils_1.throwServerError)(error);
            }
            return [...phoneSubscribers, ...emailSubscribers];
        });
    }
}
exports.SubscriberService = SubscriberService;
