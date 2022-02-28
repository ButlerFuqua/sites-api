import { Schema, model } from 'mongoose'

// Define Schema ====== //
const schema = new Schema({
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
export const EmailSubscriber = model(`EmailSubscriber`, schema)
