import mongoose from 'mongoose'

// Define Schema ====== //
const schema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, },
    paid: { type: Boolean, required: true, },
    paymentLink: { type: String },
    features: [{}]
}, {
    timestamps: {
        createdAt: `created_at`,
        updatedAt: `updated_at`
    }
})

// Export ====== //
export const Account = mongoose.model(`Account`, schema)