import {
    Body,
    Controller,
    // Get,
    Path,
    Post,
    // Query,
    Route,
    SuccessResponse,
} from "tsoa";

import { CommentService } from "../services/commentService";
import { Comment } from '../@types/comment'

@Route("comments")
export class CommentsController extends Controller {

    private service: CommentService

    constructor() {
        super()
        this.service = new CommentService()
    }

    @SuccessResponse("201", "Created") // Custom success response
    @Post("{postId}")
    public async createComment(
        @Path() postId: string,
        @Body() body: any
    ): Promise<Comment> {
        const { phoneNumber, commentBody, displayName } = body
        this.setStatus(201);
        return this.service.createComment(postId, phoneNumber, commentBody, displayName);
    }

}