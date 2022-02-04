import mongoose from 'mongoose'
const { Schema } = mongoose
import { parsePhoneNumber } from 'libphonenumber-js'

// Define Schema ====== //
const schema = new Schema({
    phoneNumber: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: (phoneNumber: string) => {
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
    phoneSubscribers: [{ type: Schema.Types.ObjectId, ref: 'PhoneSubscriber' }],
    emailSubscribers: [{ type: Schema.Types.ObjectId, ref: 'EmailSubscriber' }],
    stagedForDeletion: { type: Boolean, default: false },
    inNetwork: { type: Boolean, default: true },


}, {
    timestamps: {
        createdAt: `created_at`,
        updatedAt: `updated_at`
    }
})

// Export ====== //
export const Site = mongoose.model(`Site`, schema)
