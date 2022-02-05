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
const subscriberService_1 = require("../services/subscriberService");
const subscriberService = new subscriberService_1.SubscriberService();
// Subscribe from site
router.post('/:siteId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { siteId } = req.params;
    const { phoneNumber, email } = req.body;
    if (!phoneNumber && !email)
        return res.status(400).json({ error: `A phone number or email is required.` });
    const result = yield subscriberService.signupFromSite(siteId, { phoneNumber, email });
    if (!result)
        return res.status(418).json({ error: `I don't know what to do with that request.` });
    res.status(result.status).json(result);
}));
// Unsubscribe from link
router.post('/:siteId/unsubscribe', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { siteId } = req.params;
    const { phone, email } = req.query;
    if (!phone && !email)
        return res.status(400).json({ error: `A phone number or email is required.` });
    const result = yield subscriberService.signdownFromSite(siteId, { phone, email });
    if (!result)
        return res.status(418).json({ error: `I don't know what to do with that request.` });
    res.status(result.status).json(result);
}));
module.exports = router;
