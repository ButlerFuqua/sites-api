import express from "express";
import { CommentService } from "../services/commentService";
const router = express.Router()

const commentService = new CommentService()

// Received a text message
router.post('/:postId', async (req, res) => {
    const { postId } = req.params
    const { commentBody, phoneNumber, displayName } = req.body
    if (!commentBody || !phoneNumber || !displayName)
        return res.status(400).json({ error: `phoneNumber, displayName, and commentBody are required.` })

    const result = await commentService.createComment(postId, phoneNumber, commentBody, displayName)
    if (!result)
        return res.status(418).json({ error: `I don't know what to do with that post.` })

    res.status(result.status).json(result)

})


module.exports = router