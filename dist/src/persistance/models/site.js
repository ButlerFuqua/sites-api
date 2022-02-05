"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Site = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const { Schema } = mongoose_1.default;
const libphonenumber_js_1 = require("libphonenumber-js");
// Define Schema ====== //
const schema = new Schema({
    phoneNumber: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: (phoneNumber) => {
                return new Promise((resolve, reject) => {
                    const parsedNumber = (0, libphonenumber_js_1.parsePhoneNumber)(phoneNumber, 'US');
                    if (parsedNumber.isValid())
                        resolve(true);
                    else
                        reject(false);
                });
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
});
// Export ====== //
exports.Site = mongoose_1.default.model(`Site`, schema);
