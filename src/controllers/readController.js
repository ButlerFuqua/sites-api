const express = require('express')
const ReadSiteService = require('../services/readSiteService')
const router = express.Router()

const readSiteService = new ReadSiteService()

// Index ==/
router.get('/', async (req, res) => {
    const sites = await readSiteService.getSites()
    if (sites.error)
        return res.status(sites.status).json({ error: sites.error })
    res.status(200).json({ sites })
})

// Get one Site ==/
router.get('/:unique', async (req, res) => {
    const site = await readSiteService.getOneSite(req.params.unique)
    if (site.error)
        return res.status(site.status).json({ error: site.error })
    res.status(200).json({ site })
})

// Get posts ==/
router.get('/:id/posts', async (req, res) => {
    const { skip, limit } = req.query
    const posts = await readSiteService.getSitePosts(req.params.id, skip, limit)
    res.status(200).json({ posts })
})

module.exports = router