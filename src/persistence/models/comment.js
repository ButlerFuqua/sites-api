const mongoose = require('mongoose')
const { Schema } = mongoose

// Define Schema ====== //
const schema = new Schema({
    displayName: { type: String, required: true, },
    body: { type: String, required: true, },
    phoneNumber: { type: String, required: true },
    post: { type: Schema.Types.ObjectId, ref: 'Post', required: true, },
}, {
    timestamps: {
        createdAt: `created_at`,
        updatedAt: `updated_at`
    }
})

// Export ====== //
const Comment = mongoose.model(`Comment`, schema)
module.exports = Comment