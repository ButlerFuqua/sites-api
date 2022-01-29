const mongoose = require('mongoose')

// Define Schema ====== //
const schema = new mongoose.Schema({
    name: { type: String, required: true },
}, {
    timestamps: {
        createdAt: `created_at`,
        updatedAt: `updated_at`
    }
})

// Export ====== //
const BlackListUnique = mongoose.model(`BlackListUnique`, schema)
module.exports = BlackListUnique