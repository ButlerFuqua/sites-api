"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlackListUnique = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
// Define Schema ====== //
const schema = new mongoose_1.default.Schema({
    name: { type: String, required: true },
}, {
    timestamps: {
        createdAt: `created_at`,
        updatedAt: `updated_at`
    }
});
// Export ====== //
exports.BlackListUnique = mongoose_1.default.model(`BlackListUnique`, schema);
