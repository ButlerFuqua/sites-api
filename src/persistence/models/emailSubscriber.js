const mongoose = require('mongoose')
const { Schema } = mongoose
const { parsePhoneNumber } = require('libphonenumber-js')

// Define Schema ====== //
const schema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    sites: [{ type: Schema.Types.ObjectId, ref: 'Site', required: true }]
}, {
    timestamps: {
        createdAt: `created_at`,
        updatedAt: `updated_at`
    }
})

// Export ====== //
const EmailSubscriber = mongoose.model(`EmailSubscriber`, schema)
module.exports = EmailSubscriber