import express from "express";
const router = express.Router()

import { NewsletterService } from '../services/newsletterService'
const newsletterService = new NewsletterService()

// Received a text message
router.post('/', async (req, res) => {
    const result = await newsletterService.sendAllNewsletters()
    if (!result)
        return res.status(418).json({ error: `I don't know what to do with that post.` })

    res.status(result.status).json(result)

})

module.exports = router