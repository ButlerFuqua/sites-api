"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhoneSubscriber = void 0;
const mongoose_1 = require("mongoose");
const { parsePhoneNumber } = require('libphonenumber-js');
// Define Schema ====== //
const schema = new mongoose_1.Schema({
    phoneNumber: {
        type: String,
        required: true,
        validate: {
            validator: (phoneNumber) => {
                return new Promise((resolve, reject) => {
                    const parsedNumber = parsePhoneNumber(phoneNumber, 'US');
                    if (parsedNumber.isValid())
                        resolve(true);
                    else
                        reject(false);
                });
            }
        }
    },
    sites: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Site', required: true }]
}, {
    timestamps: {
        createdAt: `created_at`,
        updatedAt: `updated_at`
    }
});
// Export ====== //
exports.PhoneSubscriber = (0, mongoose_1.model)(`PhoneSubscriber`, schema);
