const express = require('express')
const WriteSiteService = require('../services/writeSiteService')
const router = express.Router()
const MessagingResponse = require('twilio').twiml.MessagingResponse;

const writeSiteService = new WriteSiteService()

// Received a text message
router.post('/', async (req, res) => {
    const result = await writeSiteService.determineAction(req)
    if (!result)
        return res.status(418).json({ message: `I don't know what to do with that message.` })

    if (result.error)
        return res.status(result.status).send(result.error)

    // respond without message in dev
    if (process.env.ENV === 'dev')
        return res.send(result)

    // Create Twilio message
    const twiml = new MessagingResponse();
    if (typeof result === 'string')
        twiml.message(result);
    else
        twiml.message(JSON.stringify(result));

    // Send message
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());

})


module.exports = router