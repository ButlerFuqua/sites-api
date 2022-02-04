"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Command = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
// Define Schema ====== //
const schema = new mongoose_1.default.Schema({
    name: { type: String, required: true },
    desc: { type: String, required: true },
    example: { type: String, required: true },
    updateCommand: { type: Boolean, default: false },
    param: { type: String, },
}, {
    timestamps: {
        createdAt: `created_at`,
        updatedAt: `updated_at`
    }
});
// Export ====== //
exports.Command = mongoose_1.default.model(`Command`, schema);
