const express = require('express')
const SiteService = require('../services/siteService')
const router = express.Router()
// const MessagingResponse = require('twilio').twiml.MessagingResponse;

const siteService = new SiteService()




// Index ==/
router.get('/', (req, res) => {
    const sites = siteService.getSites()
    res.status(200).json({
        message: `Get all sites, ya'll.`,
        sites
    })
})

// Create Site
router.post('/', (req, res) => {

    const twiml = new MessagingResponse();

    twiml.message(`Your Message:\n${req.body}`);

    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());


    // try {
    //     const newSite = siteService.createSite(req.body)
    //     res.status(200).json({
    //         message: `Create site, ya'll.`,
    //         newSite
    //     })
    // } catch (error) {
    //     res.status(error.status || 500).json(error)
    // }
})

// Read Site
router.get('/:id', (req, res) => {
    const id = req.params.id
    const foundSite = siteService.readSite(id)
    res.status(200).json({
        message: `Read One site, ya'll.`,
        site: foundSite
    })
})

// Update Site
router.patch('/:id', (req, res) => {
    const id = req.params.id
    const data = req.body
    const updatedSite = siteService.updateSite(id, data)
    res.status(200).json({
        message: `Update site, ya'll.`,
        site: updatedSite
    })
})

// Delete Site
router.delete('/:id', (req, res) => {
    const id = req.params.id
    const result = siteService.deleteSite(id)
    res.status(200).json({
        message: `Delete site, ya'll.`,
        success: result
    })
})

module.exports = router