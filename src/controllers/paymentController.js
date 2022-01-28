const express = require('express')
const router = express.Router()

const LogService = require('../services/logService')
const logger = new LogService()

// Received a text message
router.post('/subscription', async (req, res) => {
    const sig = req.headers['stripe-signature'];

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    // Handle the event
    let subscriptionSchedule
    switch (event.type) {
        case 'subscription_schedule.aborted':
            subscriptionSchedule = event.data.object;
            // Then define and call a function to handle the event subscription_schedule.aborted
            break;
        case 'subscription_schedule.canceled':
            subscriptionSchedule = event.data.object;
            // Then define and call a function to handle the event subscription_schedule.canceled
            break;
        case 'subscription_schedule.completed':
            subscriptionSchedule = event.data.object;
            // Then define and call a function to handle the event subscription_schedule.completed
            break;
        case 'subscription_schedule.created':
            subscriptionSchedule = event.data.object;
            // Then define and call a function to handle the event subscription_schedule.created
            break;
        case 'subscription_schedule.expiring':
            subscriptionSchedule = event.data.object;
            // Then define and call a function to handle the event subscription_schedule.expiring
            break;
        case 'subscription_schedule.released':
            subscriptionSchedule = event.data.object;
            // Then define and call a function to handle the event subscription_schedule.released
            break;
        case 'subscription_schedule.updated':
            subscriptionSchedule = event.data.object;
            // Then define and call a function to handle the event subscription_schedule.updated
            break;
        // ... handle other event types
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    await logger.logInfo(`Subscription event`, { body: req.body, event, subscriptionSchedule })

    // Return a 200 res to acknowledge receipt of the event
    res.send();

})

module.exports = router