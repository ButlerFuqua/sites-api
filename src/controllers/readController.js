const express = require('express')
const ReadService = require('../services/readService')
const router = express.Router()

const readService = new ReadService()

// Index ==/
router.get('/', (req, res) => {
    const sites = readService.getSites()
    res.status(200).json({
        message: `Get all sites, ya'll.`,
        sites
    })
})

// Get one Site ==/
router.get('/:id', async (req, res) => {
    const site = readService.getOneSite(req.params.id)
    res.status(200).json({
        message: `Get one site, ya'll.`,
        site
    })
})

// Get posts ==/
router.get('/:id/posts', async (req, res) => {
    const posts = readService.getSitePosts(req.params.id)
    res.status(200).json({
        message: `Get my posts, ya'll.`,
        posts
    })
})

module.exports = router