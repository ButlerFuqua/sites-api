import { Post } from '../persistence/models/post'
import { Comment } from '../persistence/models/comment'
import { parsePhoneNumber } from 'libphonenumber-js'
import { Comment as CommentType } from '../@types/comment'
require('../persistence')

export class CommentService {

    async createComment(postId, phoneNumber, commentBody, displayName): Promise<CommentType> {

        // validate phone number
        const parsedSubNumber = parsePhoneNumber(phoneNumber, 'US')
        if (!parsedSubNumber.isValid())
            throw new Error(`Not a valid US number: ${phoneNumber}`)

        // Find post
        let post
        try {
            post = await Post.findById(postId)
        } catch (error) {
            handle500Error(error)
        }
        if (!post)
            throw new Error(`post with id: ${postId}, not found`)

        // Validate there is a comment
        if (commentBody.trim() === '')
            throw new Error(`Comment body must contain content.`)

        // Validate there is a display name
        if (displayName.trim() === '')
            throw new Error(`Display Name must contain content.`)

        // Create comment
        let comment
        try {
            comment = await Comment.create({ phoneNumber: parsedSubNumber.number, post: post._id, body: commentBody.trim(), displayName: displayName.trim() })
        } catch (error: any) {
            throw new Error(error?.message || JSON.stringify(error))
        }

        // Update post ref
        post.comments = post.comments ? [...post.comments, comment._id] : [comment._id]

        //save post
        try {
            await post.save()
        } catch (error) {
            throw new Error(error?.message || JSON.stringify(error))
        }

        return comment as CommentType

    }

}

function handle500Error(error) {
    return {
        status: 500,
        error: error.message || JSON.stringify(error),
    }
}