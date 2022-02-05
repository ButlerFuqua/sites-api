"use strict";
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
exports.ReadSiteService = void 0;
const site_1 = require("../persistance/models/site");
const post_1 = require("../persistance/models/post");
const account_1 = require("../persistance/models/account");
const errorUtils_1 = require("../utils/errorUtils");
const dist_1 = require("@curveball/http-errors/dist");
class ReadSiteService {
    getSites(criteria = {}, skip = 0, limit = 10) {
        return __awaiter(this, void 0, void 0, function* () {
            let sites;
            try {
                sites = yield site_1.Site.find({ criteria, inNetwork: true }, null, { sort: { 'updated_at': -1 }, skip, limit, }).exec();
            }
            catch (error) {
                (0, errorUtils_1.throwServerError)(error);
            }
            if (!sites)
                throw new dist_1.NotFound(`No sites were found`);
            return sites;
        });
    }
    getAllSites(populateSubs) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (populateSubs) {
                    return yield site_1.Site.find().populate('phoneSubscribers').populate('emailSubscribers');
                }
                else {
                    return yield site_1.Site.find();
                }
            }
            catch (error) {
                (0, errorUtils_1.throwServerError)(error);
            }
        });
    }
    getOneSite(unique) {
        return __awaiter(this, void 0, void 0, function* () {
            // Return latest 3 posts
            try {
                return yield site_1.Site.findOne({ unique }).populate({
                    path: 'posts',
                    options: { limit: 3, sort: { 'updated_at': -1 } }
                });
            }
            catch (error) {
                (0, errorUtils_1.throwServerError)(error);
            }
        });
    }
    getSitePosts(id, skip = 0, limit = 10) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield post_1.Post.find({ site: id }, null, { sort: { 'updated_at': -1 }, skip, limit, }).exec();
            }
            catch (error) {
                (0, errorUtils_1.throwServerError)(error);
            }
        });
    }
    getOnePost(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield post_1.Post.findById(id).populate('comments');
            }
            catch (error) {
                (0, errorUtils_1.throwServerError)(error);
            }
        });
    }
    getAccounts() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield account_1.Account.find();
            }
            catch (error) {
                (0, errorUtils_1.throwServerError)(error);
            }
        });
    }
}
exports.ReadSiteService = ReadSiteService;
