const mongoose = require('mongoose')
const { Schema } = mongoose
const { parsePhoneNumber } = require('libphonenumber-js')

// Define Schema ====== //
const schema = new mongoose.Schema({
    phoneNumber: {
        type: String,
        required: true,
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
    sites: [{ type: Schema.Types.ObjectId, ref: 'Site', required: true }]
}, {
    timestamps: {
        createdAt: `created_at`,
        updatedAt: `updated_at`
    }
})

// Export ====== //
const Subscriber = mongoose.model(`Subscriber`, schema)
module.exports = Subscriber