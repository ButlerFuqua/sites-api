const Site = require('../persistence/models/site')
const Post = require('../persistence/models/post')
const PhoneSubscriber = require('../persistence/models/phoneSubscriber')
const EmailSubscriber = require('../persistence/models/emailSubscriber')
const { parsePhoneNumber } = require('libphonenumber-js')

module.exports = class SubScriberService {

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
            this.signupEmailSubscriber(site, email),
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
        // by phone

        const alreadySubscribedByPhone = site.phoneSubscribers.filter(sub => sub.phoneNumber).map(sub => parsePhoneNumber(sub.phoneNumber, 'US')).find(sub => sub.number === subPhoneNumber)

        // Return if both are subscribed
        if (alreadySubscribedByPhone)
            return null


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