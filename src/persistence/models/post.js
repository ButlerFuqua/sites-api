const mongoose = require('mongoose')
const { Schema } = mongoose
const { parsePhoneNumber } = require('libphonenumber-js')

// Define Schema ====== //
const schema = new Schema({
    body: { type: String },
    site: { type: Schema.Types.ObjectId, ref: 'Site' },
    comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],

}, {
    timestamps: {
        createdAt: `created_at`,
        updatedAt: `updated_at`
    }
})

// Export ====== //
const Post = mongoose.model(`Post`, schema)
module.exports = Post