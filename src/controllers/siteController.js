const express = require('express')
const SiteService = require('../services/siteService')
const router = express.Router()

const siteService = new SiteService()


// Received a text message
router.post('/', async (req, res) => {
    let result
    try {
        result = await siteService.determineAction(req)
    } catch (error) {
        return res.status(error.status || 500).json(error)
    }

    if (!result)
        return res.status(418).json({ message: `I don't know what to do with that message.` })

    return res.status(200).json(result)
})

module.exports = router