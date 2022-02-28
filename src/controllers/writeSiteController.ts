import { Request as ExRequest, Response as ExResponse } from 'express'
import {
    Controller,
    Post,
    Route,
    SuccessResponse,
    Request,
    Res,
} from "tsoa";
import twilio from "twilio";
const MessagingResponse = twilio.twiml.MessagingResponse;

import { WriteSiteService } from "../services/writeSiteService";

// Read env variables ==/
import dotenv from 'dotenv'
dotenv.config()

@Route("write")
export class WrtieSiteController extends Controller {
    private readonly service: WriteSiteService;

    constructor() {
        super()
        this.service = new WriteSiteService();
    }

    @SuccessResponse("200", "Okay") //
    @Post()
    public async createSite(
        @Request() req: ExRequest,
    ): Promise<any> {
        const result = await this.service.determineAction(req)
        if (!result) {
            this.setStatus(418)
            return { message: `I don't know what to do with that message, \(- -)/.` }
        }

        // respond without message in dev
        if (process.env.ENV === 'dev')
            return result

        // Create Twilio message
        const twiml = new MessagingResponse();
        if (typeof result === 'string')
            twiml.message(result);
        else
            twiml.message(JSON.stringify(result));

        return twiml.toString()

        // // Send message
        // res.writeHead(200, { 'Content-Type': 'text/xml' });
        // res.end(twiml.toString());
    }
}