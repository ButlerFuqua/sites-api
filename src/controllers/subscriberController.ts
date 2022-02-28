import {
    Body,
    Controller,
    Get,
    Path,
    Post,
    Query,
    Route,
    SuccessResponse,
    // Res,
    // TsoaResponse
} from "tsoa";
import { Subscriber } from "../@types/data";
import { SubscriberService } from "../services/subscriberService";
import { SignupSubscriberRequest } from "../@types/requests";
import { BadRequest } from "@curveball/http-errors/dist";

@Route("subscribers")
export class SubscribersController extends Controller {
    private readonly service: SubscriberService;

    constructor() {
        super()
        this.service = new SubscriberService();
    }

    @SuccessResponse("201", "Created") //
    @Post('{siteId}')
    public async signupSubscriber(
        @Path() siteId: string,
        @Body() body: SignupSubscriberRequest,
        // @Res() notFoundResponse: TsoaResponse<404, { reason: string }>
    ): Promise<Subscriber> {
        const { phoneNumber, email } = body
        if (!phoneNumber && !email)
            throw new BadRequest(`A phone number or email is required.`)

        const result = await this.service.signupFromSite(siteId, { phoneNumber, email })
        if (!result) {
            throw new Error(`I don't know what to do with that request, \(- -)/.`)
        }

        return result
    }

    @SuccessResponse("201", "Created") //
    @Get('{siteId}')
    public async signdownSubscriber(
        @Path() siteId: string,
        @Query() phone: string,
        @Query() email: string,
        // @Res() notFoundResponse: TsoaResponse<404, { reason: string }>
    ): Promise<any> {
        if (!phone && !email)
            throw new BadRequest(`A phone number or email is required.`)

        const result = await this.service.signdownFromSite(siteId, { phone, email })
        if (!result) {
            throw new Error(`I don't know what to do with that request, \(- -)/.`)
        }

        return result
    }
}