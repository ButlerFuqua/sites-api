"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Log = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const { Schema } = mongoose_1.default;
// Define Schema ====== //
const schema = new Schema({
    type: { type: String, required: true, },
    message: { type: String, required: true, },
    data: {},
}, {
    timestamps: {
        createdAt: `created_at`,
        updatedAt: `updated_at`
    }
});
// Export ====== //
exports.Log = mongoose_1.default.model(`Log`, schema);
