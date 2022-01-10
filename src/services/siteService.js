const { db } = require('../persistence/')

module.exports = class SiteService {

    siteInterface = {
        title: val => val ? val.toString() : null,
        name: val => val ? val.toString() : null,
        about: val => val ? val.toString() : null,
        phoneNumber: val => val.toString(),
    }

    getSites() {
        return db.find()
    }

    createSite(data) {
        if (!data.phoneNumber)
            throw new Error(`Missing phone number: ${JSON.stringify(data)}`)
        return db.create(this.returnCleanedSiteObjectData(data))
    }

    readSite(id) {
        if (!id)
            throw new Error(`Missing ID.`)
        return db.find({ _id: id })
    }

    updateSite(id, data) {
        return db.updateById(id, data)
    }

    deleteSite(id) {
        if (!id)
            throw new Error(`Missing ID.`)
        return db.findByIdAndDelete({ _id: id })
    }

    // Helper
    returnCleanedSiteObjectData(data) {
        let cleanedData = {}
        for (let prop in this.siteInterface)
            cleanedData[prop] = this.siteInterface[prop](data[prop])
        return cleanedData
    }
}