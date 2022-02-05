"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const secretKey = process.env.SECRET_KEY;
if (!secretKey)
    throw new Error(`No secret key`);
const body_parser_1 = __importDefault(require("body-parser"));
const stripe = require('stripe')(secretKey);
const logService_1 = require("../services/logService");
const logger = new logService_1.LogService();
const isDev = process.env.ENV === 'dev';
// Received a text message
router.post('/subscription', body_parser_1.default.raw({ type: 'application/json' }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const endpointSecret = process.env.ENDPOINT_SECRET;
    if (!endpointSecret) {
        if (!isDev)
            logger.logError(`No endpoint secret`);
        throw new Error(`No endpoint secret`);
    }
    const sig = req.headers['stripe-signature'];
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    }
    catch (error) {
        console.log('error', error.message || JSON.stringify(error));
        if (!isDev)
            yield logger.logError((event === null || event === void 0 ? void 0 : event.type) || `/payments/subscription`, { error });
        res.status(400).send(`Webhook Error: ${error.message}`);
        return;
    }
    // Handle the event
    let subscriptionSchedule;
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
    yield logger.logInfo((event === null || event === void 0 ? void 0 : event.type) || `/payments/subscription`, { body: req.body, event, subscriptionSchedule });
    // Return a 200 res to acknowledge receipt of the event
    res.send();
}));
module.exports = router;
