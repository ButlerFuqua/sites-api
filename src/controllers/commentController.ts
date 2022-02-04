import {
    Body,
    Controller,
    Get,
    Path,
    Post,
    Query,
    Route,
    SuccessResponse,
} from "tsoa";
import { Comment } from "../@types/data";
import { CommentService } from "../services/commentService";
import { CreateCommentRequest } from '../@types/requests'

@Route("comments")
export class CommentsController extends Controller {
    private readonly service: CommentService;

    constructor() {
        super()
        this.service = new CommentService();
    }

    @SuccessResponse("201", "Created") // Custom success response
    @Post('{postId}')
    public async createComment(
        @Path() postId: string,
        @Body() body: CreateCommentRequest
    ): Promise<Comment> {
        this.setStatus(201); // set return status 201
        return this.service.createComment(postId, body)
    }
}