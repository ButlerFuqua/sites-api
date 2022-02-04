import { Post } from '../persistance/models/post'
import { Comment } from '../persistance/models/comment'
import { parsePhoneNumber } from 'libphonenumber-js'
import {
    NotFound,
    BadRequest,
} from '@curveball/http-errors';

import {
    Comment as CommentType,
    Post as PostType,
} from '../@types/data'
require('../persistance')

import { CreateCommentRequest } from '../@types/requests'
import { throwServerError } from '../utils/errorUtils';

export class CommentService {

    async createComment(postId: string, data: CreateCommentRequest): Promise<CommentType> {

        const { phoneNumber, commentBody, displayName } = data

        // validate phone number
        const parsedSubNumber = parsePhoneNumber(phoneNumber, 'US')
        if (!parsedSubNumber.isValid())
            throw new BadRequest(`Not a valid US number: ${phoneNumber}`)

        // Find post
        let post
        try {
            post = await Post.findById(postId)
        } catch (error: any) {
            throwServerError(error)
        }
        if (!post)
            throw new NotFound(`post with id: ${postId}, not found`)

        // Validate there is a comment
        if (commentBody.trim() === '')
            throw new BadRequest(`Comment body must contain content.`)

        // Validate there is a display name
        if (displayName.trim() === '')
            throw new BadRequest(`Display Name must contain content.`)

        // TODO convert this into a transaction
        // Create comment
        let comment
        try {
            comment = await Comment.create({ phoneNumber: parsedSubNumber.number, post: post._id, body: commentBody.trim(), displayName: displayName.trim() })
        } catch (error: any) {
            throwServerError(error)
        }

        // Update post ref
        post.comments = post.comments ? [...post.comments, comment._id] : [comment._id]

        //save post
        try {
            await post.save()
        } catch (error: any) {
            throwServerError(error)
        }

        return comment as CommentType

    }

}