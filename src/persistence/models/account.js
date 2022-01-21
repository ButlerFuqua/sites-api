const mongoose = require('mongoose')

// Define Schema ====== //
const schema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, },
    paid: { type: Boolean, required: true, }
}, {
    timestamps: {
        createdAt: `created_at`,
        updatedAt: `updated_at`
    }
})

// Export ====== //
const Account = mongoose.model(`Account`, schema)
module.exports = Account