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
import { Comment } from "../@types/comment";
import { CommentService, CommentCreationParams } from "../services/commentService";

@Route("comments")
export class CommentsController extends Controller {
    @Get("{commentId}")
    public async getComment(
        @Path() commentId: number,
        @Query() name?: string
    ): Promise<Comment> {
        return new CommentService().get(commentId, name);
    }

    @SuccessResponse("201", "Created") // Custom success response
    @Post()
    public async createComment(
        @Body() requestBody: CommentCreationParams
    ): Promise<void> {
        this.setStatus(201); // set return status 201
        new CommentService().create(requestBody);
        return;
    }
}