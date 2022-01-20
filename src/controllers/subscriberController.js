const express = require('express')
const SubscriberService = require('../services/subscriberService')
const router = express.Router()

const subscriberService = new SubscriberService()

// Received a text message
router.post('/:siteId', async (req, res) => {
    const { siteId } = req.params
    const { phoneNumber, email } = req.body
    if (!phoneNumber && !email)
        return res.status(400).json({ error: `A phoneNumber or email is required.` })

    const result = await subscriberService.signupFromSite(siteId, { phoneNumber, email })
    if (!result)
        return res.status(418).json({ error: `I don't know what to do with that request.` })

    console.log('result', result)

    res.status(result.status).json(result)
})


module.exports = router