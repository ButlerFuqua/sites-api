"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailSubscriber = void 0;
const mongoose_1 = require("mongoose");
// Define Schema ====== //
const schema = new mongoose_1.Schema({
    email: {
        type: String,
        required: true,
    },
    sites: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Site', required: true }]
}, {
    timestamps: {
        createdAt: `created_at`,
        updatedAt: `updated_at`
    }
});
// Export ====== //
exports.EmailSubscriber = (0, mongoose_1.model)(`EmailSubscriber`, schema);
