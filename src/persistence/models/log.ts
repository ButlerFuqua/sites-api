import mongoose from 'mongoose'
const { Schema } = mongoose

// Define Schema ====== //
const schema = new Schema({
    type: { type: String, required: true, },
    message: { type: String, required: true, },
    data: {},
}, {
    timestamps: {
        createdAt: `created_at`,
        updatedAt: `updated_at`
    }
})

// Export ====== //
export const Log = mongoose.model(`Log`, schema)
