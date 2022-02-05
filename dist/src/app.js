"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const routes_1 = require("../dist/routes");
const tsoa_1 = require("tsoa");
const dist_1 = require("@curveball/http-errors/dist");
const cors = require('cors');
exports.app = (0, express_1.default)();
// Use body parser to read sent json payloads
// Cross origin requests ==/
exports.app.use(cors());
exports.app.use(body_parser_1.default.urlencoded({
    extended: true,
}));
exports.app.use(body_parser_1.default.json());
(0, routes_1.RegisterRoutes)(exports.app);
exports.app.use(function notFoundHandler(_req, res) {
    res.status(404).send({
        message: "Route Not Found",
    });
});
exports.app.use(function errorHandler(error, req, res, next) {
    // TODO add logging to errors
    if (error instanceof tsoa_1.ValidateError)
        return res.status(422).json({
            message: "Validation Failed",
            details: error === null || error === void 0 ? void 0 : error.fields,
        });
    if (error instanceof dist_1.HttpErrorBase)
        return res.status(error.httpStatus).json({
            message: (error === null || error === void 0 ? void 0 : error.message) || JSON.stringify(error)
        });
    // TODO make more custom errors with proper status codes
    // if (error instanceof BaseError)
    //     return res.status(500).json({
    //         message: error.message,
    //     });
    // Catch all
    if (error instanceof Error)
        return res.status(500).json({
            message: `Internal Server Error: ${(error === null || error === void 0 ? void 0 : error.message) || JSON.stringify(error)}`,
        });
    next();
});
