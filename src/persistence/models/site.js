const mongoose = require('mongoose')
const { Schema } = mongoose
const { parsePhoneNumber } = require('libphonenumber-js')

// Define Schema ====== //
const schema = new Schema({
    phoneNumber: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: phoneNumber => {
                return new Promise((resolve, reject) => {
                    const parsedNumber = parsePhoneNumber(phoneNumber, 'US')
                    if (parsedNumber.isValid()) resolve(true)
                    else reject(false)
                })
            }
        }
    },
    unique: { type: String, required: true, unique: true },
    title: { type: String, },
    owner: { type: String, },
    about: { type: String, },
    support: { type: String, },
    account: { type: Schema.Types.ObjectId, ref: 'Account' },
    posts: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
    stagedForDeletion: { type: Boolean, default: false }

}, {
    timestamps: {
        createdAt: `created_at`,
        updatedAt: `updated_at`
    }
})

// Export ====== //
const Site = mongoose.model(`Site`, schema)
module.exports = Site