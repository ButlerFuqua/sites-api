const express = require('express')
const SiteService = require('../services/siteService')
const router = express.Router()
// const MessagingResponse = require('twilio').twiml.MessagingResponse;

const siteService = new SiteService()


// Received a text message
router.post('/', async (req, res) => {
    const result = await siteService.determineAction(req)
    if (!result)
        return res.status(418).json({ message: `I don't know what to do with that message.` })

    if (result.error)
        return res.status(result.status).json({ error: result.error })


    return res.send(result)

    // // Create Twilio message
    // const twiml = new MessagingResponse();
    // if (typeof result === 'string')
    //     twiml.message(result);
    // else
    //     twiml.message(JSON.stringify(result));


    // // Send message
    // res.writeHead(200, { 'Content-Type': 'text/xml' });
    // res.end(twiml.toString());

    // return res.status(200).json(result)
})




module.exports = router