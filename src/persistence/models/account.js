const mongoose = require('mongoose')

// Define Schema ====== //
const schema = new mongoose.Schema({
    accountType: { type: String },

}, {
    timestamps: {
        createdAt: `created_at`,
        updatedAt: `updated_at`
    }
})

// Export ====== //
const Account = mongoose.model(`Account`, schema)
module.exports = Account