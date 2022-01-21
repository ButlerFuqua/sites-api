const mongoose = require('mongoose')

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
const Command = mongoose.model(`Command`, schema)
module.exports = Command