import mongoose from 'mongoose'

// Define Schema ====== //
const schema = new mongoose.Schema({
    name: { type: String, required: true },
    desc: { type: String, required: true },
    example: { type: String, required: true },
    updateCommand: { type: Boolean, default: false },
    param: { type: String, },
}, {
    timestamps: {
        createdAt: `created_at`,
        updatedAt: `updated_at`
    }
})

// Export ====== //
export const Command = mongoose.model(`Command`, schema)
