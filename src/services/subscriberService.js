const Site = require('../persistence/models/site')
const Post = require('../persistence/models/post')
const Subscriber = require('../persistence/models/subscriber')
const { parsePhoneNumber } = require('libphonenumber-js')

module.exports = class SubScriberService {

    async signup(id, phoneNumber) {
        // Get site and current subscribers
        let site
        try {
            site = await Site.findById(id).populate('subscribers')
        } catch (error) {
            return {
                status: 500,
                error: error.message || JSON.stringify(error),
            }
        }

        // Check that user has not already subscribed to the site
        const parsedNumber = parsePhoneNumber(phoneNumber, 'US')
        if (!parsedNumber.isValid()) return {
            status: 400,
            error: `Not a valid US number: ${phoneNumber}`
        }
        const alreadySubscribed = site.subscribers.map(num => parsePhoneNumber(num, 'US')).find(sub => sub.number === parsedNumber.number)
        if (alreadySubscribed)
            return {
                status: 400,
                error: `Already subscribed.`
            }

        // check if it already exists
        let subscriber
        try {
            subscriber = await Subscriber.findOne({ phoneNumber: parsedNumber })
        } catch (error) {
            return handle500Error(error)
        }

        if (subscriber) {
            // Update and return response
            try {
                subscriber.sites = [...subscriber.sites, site._id]
                return await subscriber.save()
            } catch (error) {
                return handle500Error(error)
            }

        } else {
            // Create and return response
            try {
                return await Subscriber.create({ phoneNumber: parsedNumber, sites: [site._id] })
            } catch (error) {
                return handle500Error(error)
            }
        }

    }

    async signdown(id, phoneNumber) {
        // Get site and current subscribers
        let site
        try {
            site = await Site.findById(id).populate('subscribers')
        } catch (error) {
            return {
                status: 500,
                error: error.message || JSON.stringify(error),
            }
        }

        // find subscriber to remove
        const parsedNumber = parsePhoneNumber(phoneNumber, 'US')
        if (!parsedNumber.isValid()) return {
            status: 400,
            error: `Not a valid US number: ${phoneNumber}`
        }
        const subToRemove = site.subscribers.find(sub => (parsePhoneNumber(sub.phoneNumber, 'US')).number === parsedNumber.number)
        if (!subToRemove)
            return {
                status: 400,
                error: `Subscriber to remove is not subscribed.`,
            }

        // remove from site and save to db
        try {
            site.subscribers = site.subscribers.filter(sub => sub._id.toString() != subToRemove._id.toString())
            await site.save()
        } catch (error) {
            return handle500Error(error)
        }

        // see if subscriber needs to be deleted completely, if they are not associated with another site
        let associatedSites
        try {
            associatedSites = await Site.find({ subscribers: subToRemove._id })
        } catch (error) {
            return handle500Error(error)
        }

        // Delete if not subscribed to any other site
        if (associatedSites.length < 2) { // 2 because it hasn't been removed from the current site
            try {
                return await Subscriber.findOneAndDelete({ _id: subToRemove._id })
            } catch (error) {
                return handle500Error(error)
            }
        } else {
            // remove site from subscriber array
            try {
                subToRemove.sites = subToRemove.sites.filter(subSite => subSite._id != site._id)
                return await subToRemove.save()
            } catch (error) {
                return handle500Error(error)
            }
        }
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