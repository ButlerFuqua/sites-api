"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.throwServerError = void 0;
const throwServerError = (error) => {
    throw new Error((error === null || error === void 0 ? void 0 : error.message) || JSON.stringify(error));
};
exports.throwServerError = throwServerError;
