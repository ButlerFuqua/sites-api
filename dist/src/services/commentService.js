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
exports.CommentService = void 0;
const post_1 = require("../persistance/models/post");
const comment_1 = require("../persistance/models/comment");
const libphonenumber_js_1 = require("libphonenumber-js");
const http_errors_1 = require("@curveball/http-errors");
require('../persistance');
const errorUtils_1 = require("../utils/errorUtils");
class CommentService {
    createComment(postId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { phoneNumber, commentBody, displayName } = data;
            // validate phone number
            const parsedSubNumber = (0, libphonenumber_js_1.parsePhoneNumber)(phoneNumber, 'US');
            if (!parsedSubNumber.isValid())
                throw new http_errors_1.BadRequest(`Not a valid US number: ${phoneNumber}`);
            // Find post
            let post;
            try {
                post = yield post_1.Post.findById(postId);
            }
            catch (error) {
                (0, errorUtils_1.throwServerError)(error);
            }
            if (!post)
                throw new http_errors_1.NotFound(`post with id: ${postId}, not found`);
            // Validate there is a comment
            if (commentBody.trim() === '')
                throw new http_errors_1.BadRequest(`Comment body must contain content.`);
            // Validate there is a display name
            if (displayName.trim() === '')
                throw new http_errors_1.BadRequest(`Display Name must contain content.`);
            // TODO convert this into a transaction
            // Create comment
            let comment;
            try {
                comment = yield comment_1.Comment.create({ phoneNumber: parsedSubNumber.number, post: post._id, body: commentBody.trim(), displayName: displayName.trim() });
            }
            catch (error) {
                (0, errorUtils_1.throwServerError)(error);
            }
            // Update post ref
            post.comments = post.comments ? [...post.comments, comment._id] : [comment._id];
            //save post
            try {
                yield post.save();
            }
            catch (error) {
                (0, errorUtils_1.throwServerError)(error);
            }
            return comment;
        });
    }
}
exports.CommentService = CommentService;
