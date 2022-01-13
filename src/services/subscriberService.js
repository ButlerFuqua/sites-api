const Site = require('../persistence/models/site')
const Post = require('../persistence/models/post')
const Subscriber = require('../persistence/models/subscriber')
const { parsePhoneNumber } = require('libphonenumber-js')

module.exports = class SubScriberService {

    async signup(sitePhoneNumber, subPhoneNumber) {
        const parsedSiteNumber = parsePhoneNumber(sitePhoneNumber, 'US')
        // Get site and current subscribers
        let site
        try {
            site = await Site.findOne({ phoneNumber: parsedSiteNumber.number }).populate('subscribers')
        } catch (error) {
            return {
                status: 500,
                error: error.message || JSON.stringify(error),
            }
        }
        if (!site)
            return {
                status: 404,
                error: `Site not found for phone number: ${sitePhoneNumber}`
            }

        // Check that user has not already subscribed to the site
        const parsedSubNumber = parsePhoneNumber(subPhoneNumber, 'US')
        if (!parsedSubNumber.isValid()) return {
            status: 400,
            error: `Not a valid US number: ${subPhoneNumber}`
        }
        const alreadySubscribed = site.subscribers.map(num => parsePhoneNumber(num, 'US')).find(sub => sub.number === parsedSubNumber.number)
        if (alreadySubscribed)
            return {
                status: 400,
                error: `Already subscribed.`
            }

        // check if it already exists
        let subscriber
        try {
            subscriber = await Subscriber.findOne({ phoneNumber: parsedSubNumber.number })
        } catch (error) {
            return handle500Error(error)
        }

        if (subscriber) {
            // Associate site to subscriber
            try {
                subscriber.sites = [...subscriber.sites, site._id]
                await subscriber.save()
            } catch (error) {
                return handle500Error(error)
            }

        } else {
            // Create new subscriber
            try {
                subscriber = await Subscriber.create({ phoneNumber: parsedSubNumber.number, sites: [site._id] })
            } catch (error) {
                return handle500Error(error)
            }
        }

        // Add subscriber to site and return
        try {
            site.subscribers = [...site.subscribers, subscriber._id]
            await site.save()
            return subscriber
        } catch (error) {
            return handle500Error(error)
        }

    }

    async signdown(sitePhoneNumber, subPhoneNumber) {

        // get subscriber
        const parsedSubNumber = parsePhoneNumber(subPhoneNumber, 'US')
        if (!parsedSubNumber.isValid()) return {
            status: 400,
            error: `Not a valid US number: ${subPhoneNumber}`
        }
        let subToRemove
        try {
            subToRemove = await Subscriber.findOne({ phoneNumber: parsedSubNumber.number })
        } catch (error) {
            return handle500Error(error)
        }

        // get site
        let site
        const parsedSiteNumber = parsePhoneNumber(sitePhoneNumber, 'US')
        if (!parsedSiteNumber.isValid()) return {
            status: 400,
            error: `Not a valid US number: ${sitePhoneNumber}`
        }
        try {
            site = await Site.findOne({ phoneNumber: parsedSiteNumber.number })
        } catch (error) {
            return handle500Error(error)
        }

        // remove refs
        site.subscribers = site.subscribers.filter(subId => subId.toString() !== subToRemove._id.toString())
        subToRemove.sites = subToRemove.sites.filter(siteId => siteId.toString() !== site._id.toString())


        // Save site
        try {
            await site.save()
        } catch (error) {
            return handle500Error(error)
        }

        // find if sub has other sites
        const deleteSub = subToRemove.sites.length < 1

        if (deleteSub) {
            try {
                await Subscriber.findOneAndDelete({ _id: subToRemove._id })
            } catch (error) {
                return handle500Error(error)
            }
        }
        else {
            // keep sub because it's associated to other sites
            try {
                await subToRemove.save()
            } catch (error) {
                return handle500Error(error)
            }
        }

        return { phoneNumber: subPhoneNumber }

    }

    async deleteFloatingSubscribers() {
        // TODO - delete all subscribers that have no existing site
    }

    async getSiteSubscribers(id) {
        try {
            return await Subscriber.find({ site: id })
        } catch (error) {
            return handle500Error(error)
        }
    }

}

function handle500Error(error) {
    return {
        status: 500,
        error: error.message || JSON.stringify(error),
    }
}