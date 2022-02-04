import express from "express";
const router = express.Router()

import { SubscriberService } from "../services/subscriberService";
const subscriberService = new SubscriberService()

// Subscribe from site
router.post('/:siteId', async (req, res) => {
    const { siteId } = req.params
    const { phoneNumber, email } = req.body
    if (!phoneNumber && !email)
        return res.status(400).json({ error: `A phone number or email is required.` })

    const result = await subscriberService.signupFromSite(siteId, { phoneNumber, email })
    if (!result)
        return res.status(418).json({ error: `I don't know what to do with that request.` })

    res.status(result.status).json(result)
})

// Unsubscribe from link
router.post('/:siteId/unsubscribe', async (req, res) => {
    const { siteId } = req.params
    const { phone, email } = req.query
    if (!phone && !email)
        return res.status(400).json({ error: `A phone number or email is required.` })

    const result = await subscriberService.signdownFromSite(siteId, { phone, email })
    if (!result)
        return res.status(418).json({ error: `I don't know what to do with that request.` })

    res.status(result.status).json(result)
})


module.exports = router