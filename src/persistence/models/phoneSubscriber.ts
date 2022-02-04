import { Schema, model } from 'mongoose'
const { parsePhoneNumber } = require('libphonenumber-js')

// Define Schema ====== //
const schema = new Schema({
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
export const PhoneSubscriber = model(`PhoneSubscriber`, schema)
