const Site = require('../persistence/models/site')
const PhoneSubscriber = require('../persistence/models/phoneSubscriber')
const EmailSubscriber = require('../persistence/models/emailSubscriber')
const { parsePhoneNumber } = require('libphonenumber-js')
const Account = require('../persistence/models/account')

export class SubscriberService {

    async getAllSubscribers({ getSitesToo }) {
        // get all phoneSubscribers
        let phoneSubscribers
        try {
            if (getSitesToo)
                phoneSubscribers = await PhoneSubscriber.find().populate('sites', 'unique')
            else
                phoneSubscribers = await PhoneSubscriber.find()
        } catch (error) {
            phoneSubscribers = { error }
        }

        // get all emailSubscribers
        let emailSubscribers
        try {
            if (getSitesToo)
                emailSubscribers = await EmailSubscriber.find().populate('sites', 'unique')
            else
                emailSubscribers = await EmailSubscriber.find()
        } catch (error) {
            emailSubscribers = { error }
        }

        return { phoneSubscribers, emailSubscribers }
    }

    async signupFromSite(siteId, options) {

        const { email, phoneNumber } = options
        if (!email && !phoneNumber) return {
            status: 400,
            error: `No email or phone number.`
        }

        // Validate phone
        let parsedSubNumber
        let subPhoneNumber
        if (phoneNumber) {
            parsedSubNumber = parsePhoneNumber(phoneNumber, 'US')
            if (!parsedSubNumber.isValid()) return {
                status: 400,
                error: `Not a valid US number: ${phoneNumber}`
            }
            subPhoneNumber = parsedSubNumber.number
        }

        // Validate email
        if (email) {
            const regex = RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)
            if (!regex.test(email)) return {
                status: 400,
                error: `Not a valid email: ${email}`
            }
        }


        // Get site and current subscribers
        let site
        try {
            site = await Site.findById(siteId).populate('phoneSubscribers').populate('emailSubscribers')
        } catch (error) {
            return {
                status: 500,
                error: error.message || JSON.stringify(error),
            }
        }
        if (!site)
            return {
                status: 404,
                error: `Site not found, ID: ${siteId}`
            }

        // save/create subscribers and return value
        const [phoneSubscriber, emailSubscriber] = await Promise.all([
            this.signupPhoneSubscriber(site, subPhoneNumber),
            this.signupEmailSubscriber(site, email?.toLowerCase()),
        ])

        if (phoneSubscriber?.error || emailSubscriber?.error)
            return phoneSubscriber || emailSubscriber

        // Update site
        if (phoneSubscriber)
            site.phoneSubscribers = [...site.phoneSubscribers, phoneSubscriber._id]
        if (emailSubscriber)
            site.emailSubscribers = [...site.emailSubscribers, emailSubscriber._id]

        try {
            await site.save()
        } catch (error) {
            return handle500Error(error)
        }

        return {
            status: 200,
            phone: phoneSubscriber,
            email: emailSubscriber,
        }
    }



    async signupPhoneSubscriber(site, subPhoneNumber) {
        if (!subPhoneNumber)
            return null



        // Check that user has not already subscribed to the site
        const alreadySubscribedByPhone = site.phoneSubscribers.filter(sub => sub.phoneNumber).map(sub => parsePhoneNumber(sub.phoneNumber, 'US')).find(sub => sub.number === subPhoneNumber)

        // Return if both are subscribed
        if (alreadySubscribedByPhone)
            return null

        // Make sure account allows another subscription
        const allowMore = await this.doesAccountAllowMoreSubs(site)
        if (!allowMore)
            return {
                status: 400,
                error: `Account does not allow any more subscribers.`
            }

        // check if it already exists
        let subscriberPhone
        try {
            subscriberPhone = await PhoneSubscriber.findOne({ phoneNumber: subPhoneNumber })
        } catch (error) {
            return handle500Error(error)
        }

        if (subscriberPhone) {
            // Associate site to subscriber
            try {
                subscriberPhone.sites = [...subscriberPhone.sites, site._id]
                await subscriberPhone.save()
            } catch (error) {
                return handle500Error(error)
            }
        } else {
            // Create new subscriber
            try {
                subscriberPhone = await PhoneSubscriber.create({
                    phoneNumber: subPhoneNumber,
                    sites: [site._id]
                })
            } catch (error) {
                return handle500Error(error)
            }
        }

        return subscriberPhone


    }

    async signupEmailSubscriber(site, email) {
        if (!email)
            return null



        // Check that user has not already subscribed to the site
        const alreadySubscribedByEmail = site.emailSubscribers.find(sub => sub.email === email)

        // Return if both are subscribed
        if (alreadySubscribedByEmail)
            return null

        // Make sure account allows another subscription
        const allowMore = await this.doesAccountAllowMoreSubs(site)
        if (!allowMore)
            return {
                status: 400,
                error: `Account does not allow any more subscribers.`
            }

        // check if it already exists
        let subscriberEmail
        try {
            subscriberEmail = await EmailSubscriber.findOne({ email })
        } catch (error) {
            return handle500Error(error)
        }

        if (subscriberEmail) {
            try {
                subscriberEmail.sites = [...subscriberEmail.sites, site._id]
                await subscriberEmail.save()
            } catch (error) {
                return handle500Error(error)
            }

        } else {
            // Create new subscriber
            try {
                subscriberEmail = await EmailSubscriber.create({
                    email,
                    sites: [site._id]
                })
            } catch (error) {
                return handle500Error(error)
            }
        }
        return subscriberEmail

    }


    async doesAccountAllowMoreSubs(site) {
        // Make sure account allows another subscription
        let account
        try {
            account = await Account.findById(site.account)
        } catch (error) {
            return handle500Error(error)
        }
        const currentSubCount = site.phoneSubscribers.length + site.emailSubscribers.length
        const subFeature = account.features.find(feature => feature.name === 'Subscribers')
        return currentSubCount < subFeature.max
    }


    async signdownFromSite(siteId, options) {

        // TODO come up with some sort of auth, maybe a token.

        const { email, phone: phoneNumber } = options
        if (!email && !phoneNumber) return {
            status: 400,
            error: `No email or phone number.`
        }

        // Validate phone
        let parsedSubNumber
        let subPhoneNumber
        if (phoneNumber) {
            parsedSubNumber = parsePhoneNumber(phoneNumber, 'US')
            if (!parsedSubNumber.isValid()) return {
                status: 400,
                error: `Not a valid US number: ${phoneNumber}`
            }
            subPhoneNumber = parsedSubNumber.number
        }

        // Validate email
        if (email) {
            const regex = RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)
            if (!regex.test(email)) return {
                status: 400,
                error: `Not a valid email: ${email}`
            }
        }


        // Get site and current subscribers
        let site
        try {
            site = await Site.findById(siteId).populate('phoneSubscribers').populate('emailSubscribers')
        } catch (error) {
            return {
                status: 500,
                error: error.message || JSON.stringify(error),
            }
        }
        if (!site)
            return {
                status: 404,
                error: `Site not found, ID: ${siteId}`
            }

        // save/create subscribers and return value
        const [phoneSubscriber, emailSubscriber] = await Promise.all([
            this.signdownPhoneSubscriber(site, subPhoneNumber),
            this.signdownEmailSubscriber(site, email?.toLowerCase()),
        ])

        // Create errors array to push
        let errors = []
        if (phoneSubscriber?.error)
            errors.push(phoneSubscriber.error)
        if (emailSubscriber?.error)
            errors.push(emailSubscriber.error)


        // Update site
        if (phoneSubscriber && !phoneSubscriber?.error)
            site.phoneSubscribers = site.phoneSubscribers.filter(sub => sub._id.toString() !== phoneSubscriber._id.toString())
        if (emailSubscriber && !emailSubscriber?.error)
            site.emailSubscribers = site.emailSubscribers.filter(sub => sub._id.toString() !== emailSubscriber._id.toString())

        try {
            await site.save()
        } catch (error) {
            return handle500Error(error)
        }

        return {
            status: 200,
            phone: subPhoneNumber && !phoneSubscriber?.error ? `Unsubscribed ${subPhoneNumber}` : null,
            email: email && !emailSubscriber?.error ? `Unsubscribed ${email}` : null,
            errors,
        }
    }

    async signdownPhoneSubscriber(site, subPhoneNumber) {
        if (!subPhoneNumber)
            return null

        // Get subscriber
        let subscriber
        try {
            subscriber = await PhoneSubscriber.findOne({ phoneNumber: subPhoneNumber })
        } catch (error) {
            return handle500Error(error)
        }


        if (!subscriber)
            return {
                status: 404,
                error: `Phone subscriber not found: ${subPhoneNumber}`
            }

        // Remove site from sites
        subscriber.sites = subscriber.sites.filter(subbedSite => subbedSite._id.toString() !== site._id.toString())

        // decide to update or delete
        if (subscriber.sites.length < 1) {
            try {
                await PhoneSubscriber.findByIdAndDelete(subscriber._id)
            } catch (error) {
                return handle500Error(error)
            }
        } else {
            try {
                await subscriber.save()
            } catch (error) {
                return handle500Error(error)
            }
        }

        return subscriber
    }

    async signdownEmailSubscriber(site, email) {
        if (!email)
            return null

        // Get subscriber
        let subscriber
        try {
            subscriber = await EmailSubscriber.findOne({ email })
        } catch (error) {
            return handle500Error(error)
        }

        if (!subscriber)
            return {
                status: 404,
                error: `Email subscriber not found: ${email}`
            }

        // Remove site from sites
        subscriber.sites = subscriber.sites.filter(subbedSite => subbedSite._id.toString() !== site._id.toString())

        // decide to update or delete
        if (subscriber.sites.length < 1) {
            try {
                await EmailSubscriber.findByIdAndDelete(subscriber._id)
            } catch (error) {
                return handle500Error(error)
            }
        } else {
            try {
                await subscriber.save()
            } catch (error) {
                return handle500Error(error)
            }
        }

        return subscriber
    }



    async deleteFloatingSubscribers() {
        // TODO - delete all subscribers that have no existing site
    }

    async getSiteSubscribers(id) {
        let subscribers
        try {
            subscribers.phone = await PhoneSubscriber.find({ site: id })
        } catch (error) {
            return handle500Error(error)
        }
        try {
            subscribers.email = await EmailSubscriber.find({ site: id })
        } catch (error) {
            return handle500Error(error)
        }
        return {
            status: 200,
            subscribers,
        }
    }

}

function handle500Error(error) {
    return {
        status: 500,
        error: error.message || JSON.stringify(error),
    }
}