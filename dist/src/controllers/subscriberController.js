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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscribersController = void 0;
const tsoa_1 = require("tsoa");
const subscriberService_1 = require("../services/subscriberService");
const dist_1 = require("@curveball/http-errors/dist");
let SubscribersController = class SubscribersController extends tsoa_1.Controller {
    constructor() {
        super();
        this.service = new subscriberService_1.SubscriberService();
    }
    signupSubscriber(siteId, body) {
        return __awaiter(this, void 0, void 0, function* () {
            const { phoneNumber, email } = body;
            if (!phoneNumber && !email)
                throw new dist_1.BadRequest(`A phone number or email is required.`);
            const result = yield this.service.signupFromSite(siteId, { phoneNumber, email });
            if (!result) {
                throw new Error(`I don't know what to do with that request, \(- -)/.`);
            }
            return result;
        });
    }
    signdownSubscriber(siteId, phone, email) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!phone && !email)
                throw new dist_1.BadRequest(`A phone number or email is required.`);
            const result = yield this.service.signdownFromSite(siteId, { phone, email });
            if (!result) {
                throw new Error(`I don't know what to do with that request, \(- -)/.`);
            }
            return result;
        });
    }
};
__decorate([
    (0, tsoa_1.SuccessResponse)("201", "Created") //
    ,
    (0, tsoa_1.Post)('{siteId}'),
    __param(0, (0, tsoa_1.Path)()),
    __param(1, (0, tsoa_1.Body)())
], SubscribersController.prototype, "signupSubscriber", null);
__decorate([
    (0, tsoa_1.SuccessResponse)("201", "Created") //
    ,
    (0, tsoa_1.Get)('{siteId}'),
    __param(0, (0, tsoa_1.Path)()),
    __param(1, (0, tsoa_1.Query)()),
    __param(2, (0, tsoa_1.Query)())
], SubscribersController.prototype, "signdownSubscriber", null);
SubscribersController = __decorate([
    (0, tsoa_1.Route)("subscribers")
], SubscribersController);
exports.SubscribersController = SubscribersController;
