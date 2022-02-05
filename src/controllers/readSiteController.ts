import {
    Request as ExRequest,
    Response as ExResponse,
} from 'express'
import {
    Controller,
    Route,
    SuccessResponse,
    Request,
    Get,
} from "tsoa";
import { Site } from "../@types/data";
import { ReadSiteService } from "../services/readSiteService";

@Route("comments")
export class ReadSiteController extends Controller {
    private readonly service: ReadSiteService;

    constructor() {
        super()
        this.service = new ReadSiteService();
    }

    @SuccessResponse("200", "Ok") //
    @Get()
    public async createSite(
        @Request() req: ExRequest,
    ): Promise<Site[]> {
        const { skip, limit } = req.query
        const numberToSkip: number = !isNaN(Number(skip)) ? Number(skip) : 0
        const numberToLimit: number = !isNaN(Number(limit)) ? Number(limit) : 0
        return await this.service.getSites(undefined, numberToSkip, numberToLimit)
    }
}