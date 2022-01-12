const express = require('express')
const ReadService = require('../services/readService')
const router = express.Router()

const readService = new ReadService()

// Index ==/
router.get('/', async (req, res) => {
    const sites = await readService.getSites()
    if (sites.error)
        return res.status(sites.status).json({ error: sites.error })
    res.status(200).json({ sites })
})

// Get one Site ==/
router.get('/:id', async (req, res) => {
    const site = await readService.getOneSite(req.params.id)
    if (site.error)
        return res.status(site.status).json({ error: site.error })
    res.status(200).json({ site })
})

// Get posts ==/
router.get('/:id/posts', async (req, res) => {
    const posts = await readService.getSitePosts(req.params.id)
    res.status(200).json({ posts })
})

module.exports = router