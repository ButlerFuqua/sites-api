import { Post } from '../persistence/models/post'
import { Comment } from '../persistence/models/comment'
import { parsePhoneNumber } from 'libphonenumber-js'
require('../persistence')

export class CommentService {

    async createComment(postId, phoneNumber, commentBody, displayName) {

        // validate phone number
        const parsedSubNumber = parsePhoneNumber(phoneNumber, 'US')
        if (!parsedSubNumber.isValid()) return {
            status: 400,
            error: `Not a valid US number: ${phoneNumber}`
        }

        // Find post
        let post
        try {
            post = await Post.findById(postId)
        } catch (error) {
            handle500Error(error)
        }
        if (!post)
            return {
                status: 404,
                error: `post with id: ${postId}, not found`
            }

        // Validate there is a comment
        if (commentBody.trim() === '')
            return {
                status: 400,
                error: `Comment body must contain content.`
            }

        // Validate there is a display name
        if (displayName.trim() === '')
            return {
                status: 400,
                error: `Display Name must contain content.`
            }

        // Create comment
        let comment
        try {
            comment = await Comment.create({ phoneNumber: parsedSubNumber.number, post: post._id, body: commentBody.trim(), displayName: displayName.trim() })
        } catch (error) {
            return handle500Error(error)
        }

        // Update post ref
        post.comments = post.comments ? [...post.comments, comment._id] : [comment._id]

        //save post
        try {
            await post.save()
        } catch (error) {
            handle500Error(error)
        }

        return {
            status: 200,
            comment,
        }

    }

}

function handle500Error(error) {
    return {
        status: 500,
        error: error.message || JSON.stringify(error),
    }
}