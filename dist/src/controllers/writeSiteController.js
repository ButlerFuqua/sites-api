"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WrtieSiteController = void 0;
const tsoa_1 = require("tsoa");
const twilio_1 = __importDefault(require("twilio"));
const MessagingResponse = twilio_1.default.twiml.MessagingResponse;
const writeSiteService_1 = require("../services/writeSiteService");
// Read env variables ==/
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
let WrtieSiteController = class WrtieSiteController extends tsoa_1.Controller {
    constructor() {
        super();
        this.service = new writeSiteService_1.WriteSiteService();
    }
    createSite(req) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.service.determineAction(req);
            if (!result) {
                this.setStatus(418);
                return { message: `I don't know what to do with that message, \(- -)/.` };
            }
            // respond without message in dev
            if (process.env.ENV === 'dev')
                return result;
            // Create Twilio message
            const twiml = new MessagingResponse();
            if (typeof result === 'string')
                twiml.message(result);
            else
                twiml.message(JSON.stringify(result));
            return twiml.toString();
            // // Send message
            // res.writeHead(200, { 'Content-Type': 'text/xml' });
            // res.end(twiml.toString());
        });
    }
};
__decorate([
    (0, tsoa_1.SuccessResponse)("200", "Okay") //
    ,
    (0, tsoa_1.Post)(),
    __param(0, (0, tsoa_1.Request)())
], WrtieSiteController.prototype, "createSite", null);
WrtieSiteController = __decorate([
    (0, tsoa_1.Route)("write")
], WrtieSiteController);
exports.WrtieSiteController = WrtieSiteController;
