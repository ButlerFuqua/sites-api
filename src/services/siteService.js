const { db } = require('../persistence/')

module.exports = class SiteService {

    determineAction(req) {

        /*
         * Possible actions 
         */

        // Create a new site
        if (isCreateSite(req))
            return this.createSite(req.body.From)

        // Patch update
        // Delete an existing site
        // Post to site
        // Delete a Post
        // Send list of commands

        return false

    }

    isCreateSite(req) {
        // check if there is a site with the following number
        // yes => false, no => true
    }
    createSite(phoneNumber) {
        // logic
    }

}