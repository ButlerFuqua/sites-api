"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Comment = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const { Schema } = mongoose_1.default;
// Define Schema ====== //
const schema = new Schema({
    displayName: { type: String, required: true, },
    body: { type: String, required: true, },
    phoneNumber: { type: String, required: true },
    post: { type: Schema.Types.ObjectId, ref: 'Post', required: true, },
}, {
    timestamps: {
        createdAt: `created_at`,
        updatedAt: `updated_at`
    }
});
// Export ====== //
exports.Comment = mongoose_1.default.model(`Comment`, schema);
