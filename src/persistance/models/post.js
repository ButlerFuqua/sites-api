"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Post = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const { Schema } = mongoose_1.default;
const { parsePhoneNumber } = require('libphonenumber-js');
// Define Schema ====== //
const schema = new Schema({
    body: { type: String },
    site: { type: Schema.Types.ObjectId, ref: 'Site' },
    comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
}, {
    timestamps: {
        createdAt: `created_at`,
        updatedAt: `updated_at`
    }
});
// Export ====== //
exports.Post = mongoose_1.default.model(`Post`, schema);
