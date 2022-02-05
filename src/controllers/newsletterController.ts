import {
    Body,
    Controller,
    Path,
    Post,
    Res,
    Route,
    SuccessResponse,
    TsoaResponse,
    // Res,
    // TsoaResponse
} from "tsoa";
import { NewsletterService } from "../services/newsletterService";


@Route("newsletter")
export class NewslettersController extends Controller {
    private readonly service: NewsletterService;

    constructor() {
        super()
        this.service = new NewsletterService();
    }

    @SuccessResponse("200", "Ok") //
    @Post()
    public async sendAllNewsletters(
    ): Promise<any> {
        const result = await this.service.sendAllNewsletters()
        if (!result) {
            this.setStatus(418)
            return { message: `I don't know what to do \(- -)/.` }
        }
        return result
    }
}