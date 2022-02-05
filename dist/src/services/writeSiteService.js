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
exports.WriteSiteService = void 0;
const unique_names_generator_1 = require("unique-names-generator");
const libphonenumber_js_1 = require("libphonenumber-js");
const site_1 = require("../persistance/models/site");
const post_1 = require("../persistance/models/post");
const account_1 = require("../persistance/models/account");
const blacklistUnique_1 = require("../persistance/models/blacklistUnique");
const command_1 = require("../persistance/models/command");
require('../persistance');
const subscriberService_1 = require("./subscriberService");
const errorUtils_1 = require("../utils/errorUtils");
const dist_1 = require("@curveball/http-errors/dist");
class WriteSiteService {
    constructor() {
        this.subService = new subscriberService_1.SubscriberService();
        this.siteUrl = process.env.SITE_URL || 'localhost:3000';
        this.helpSiteUrl = process.env.HELP_SITE_URL || `${this.siteUrl}/help`;
        // Fetch commands
        let allCommands;
        try {
            allCommands = command_1.Command.find();
        }
        catch (error) {
            (0, errorUtils_1.throwServerError)(error);
        }
        this.availableCommands = allCommands.map((cmd) => cmd.name);
        this.updateSiteCommands = allCommands.filter((cmd) => cmd.updateCommand).map((cmd) => cmd.name);
        // Fetch blackListedUniques
        let allBlacklistUniques;
        try {
            allBlacklistUniques = blacklistUnique_1.BlackListUnique.find();
        }
        catch (error) {
            (0, errorUtils_1.throwServerError)(error);
        }
        this.blackListedUniques = allBlacklistUniques.map((unique) => unique.name);
        this.badCommandMessage = `Command invalid or missing. Available commands:\n${this.availableCommands.join('\n')}`;
        // data from request ( to make TS happy)
        this.req = null;
        this.command = null;
        this.messageData = null;
    }
    determineAction(req) {
        return __awaiter(this, void 0, void 0, function* () {
            /*
             * Possible actions
             */
            this.req = req;
            // Create a new site
            if (yield this.isCreateSite())
                return yield this.createSite();
            // Is it a command
            this.command = this.isCommand();
            if (this.command) {
                switch (this.command.name) {
                    case 'post':
                        return yield this.postToSite();
                    case 'remove':
                        return yield this.deletePost();
                    case 'up':
                        return yield this.signupSubscriber();
                    case 'down':
                        return yield this.signdownSubscriber();
                    case 'delete':
                        return yield this.areYouSureDelete();
                    case 'death':
                        return yield this.forRealDelete();
                    case 'help':
                        return this.sendHelp();
                    case 'account':
                        return this.updateAccount();
                    default:
                        break;
                }
                // Update site
                if (this.updateSiteCommands.includes(this.command))
                    return yield this.updateSite();
            }
            // Send list of commands
            return false;
        });
    }
    isCreateSite() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.req)
                throw new dist_1.BadRequest(`isCreateSite() was given no request.`);
            // check if there is a site with the following number
            const parsedNumber = (0, libphonenumber_js_1.parsePhoneNumber)(this.req.body.From, 'US');
            let foundSites;
            try {
                foundSites = yield site_1.Site.find({ phoneNumber: parsedNumber.number });
            }
            catch (error) {
                (0, errorUtils_1.throwServerError)(error);
            }
            // yes => false, no => true
            return foundSites.length < 1; // return true (isCreateSite), if there are no sites
        });
    }
    createSite() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.req)
                throw new dist_1.BadRequest(`createSite) received no response.`);
            // Generate random site name
            const randomName = (0, unique_names_generator_1.uniqueNamesGenerator)({
                dictionaries: [unique_names_generator_1.colors, unique_names_generator_1.starWars],
                length: 2
            });
            const phoneNumber = (0, libphonenumber_js_1.parsePhoneNumber)(this.req.body.From, 'US');
            const tempFromNum = phoneNumber.number.substring(6);
            const tempSiteName = `${randomName.trim().replace(/_/, '-').replace(/\s/g, '-')}-${tempFromNum}`;
            // Make sure the unique name doesn't already exist
            let foundSites;
            try {
                foundSites = yield site_1.Site.find({ unique: tempSiteName.toLowerCase() });
            }
            catch (error) {
                (0, errorUtils_1.throwServerError)(error);
            }
            // It's unlikely to happen, especially twice, so ask to make the site again.
            if ((foundSites === null || foundSites === void 0 ? void 0 : foundSites.length) > 0)
                return `Sorry, there was a mistake creating your site. Can you send that message again?`;
            // Get Free account as default
            let account;
            try {
                account = yield account_1.Account.findOne({ name: 'Free' });
            }
            catch (error) {
                (0, errorUtils_1.throwServerError)(error);
            }
            let newSite;
            try {
                newSite = yield site_1.Site.create({ phoneNumber: phoneNumber.number, unique: tempSiteName.toLowerCase(), account: account._id });
            }
            catch (error) {
                (0, errorUtils_1.throwServerError)(error);
            }
            if (!newSite)
                throw new dist_1.NotFound(`Site with number ${this.req.body.From} was not found.`);
            return `Your site has been created!\nText "help" for how to update and post.\nVisit your site: ${this.siteUrl}/${newSite.unique}`;
        });
    }
    isCommand() {
        if (!this.req)
            throw new dist_1.BadRequest(`isCommand() was given no request.`);
        const message = this.req.body.Body.trim().split(' ');
        if (this.availableCommands.includes(message[0].toLowerCase())) {
            const command = message[0].toLowerCase();
            this.messageData = this.req.body.Body.replace(message[0], '').trim();
            return command;
        }
        else
            throw new dist_1.BadRequest(this.badCommandMessage);
    }
    updateSite() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.req)
                throw new dist_1.BadRequest(`isCommand() was given no request.`);
            if (!this.command)
                throw new dist_1.BadRequest(`No command was given to update site.`);
            if (!this.messageData)
                throw new dist_1.BadRequest(`No messageData was given to update site.`);
            if (this.command.name === 'unique') {
                const unique = this.messageData.toLowerCase().replace(/-/g, '').replace(/_/g, '').replace(/\s/g, '');
                if (this.blackListedUniques.includes(unique))
                    return `Sorry, ${this.messageData} is not available as a unique name.`;
                this.messageData = this.messageData.toLowerCase().replace(/\s/g, '-');
            }
            // parse number
            const phoneNumber = this.req.body.From;
            const parsedNumber = (0, libphonenumber_js_1.parsePhoneNumber)(phoneNumber, 'US');
            // update site
            let result;
            try {
                result = yield site_1.Site.findOneAndUpdate({ phoneNumber: parsedNumber.number }, { [this.command.name]: this.messageData });
            }
            catch (error) {
                (0, errorUtils_1.throwServerError)(error);
            }
            if (!result)
                return `Sorry! Couldn't find for the number ${phoneNumber}`;
            return `Update made! ${this.command} = ${this.messageData}`;
        });
    }
    postToSite() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.req)
                throw new dist_1.BadRequest(`postToSite() was given no request.`);
            const parsedNumber = (0, libphonenumber_js_1.parsePhoneNumber)(this.req.body.From, 'US');
            // Get site
            let site;
            try {
                site = yield site_1.Site.findOne({ phoneNumber: parsedNumber.number });
            }
            catch (error) {
                (0, errorUtils_1.throwServerError)(error);
            }
            if (!site)
                return `Sorry, site not found for number ${this.req.body.From}`;
            // Create post
            let newPost;
            try {
                newPost = yield post_1.Post.create({ body: this.messageData, site: site._id });
            }
            catch (error) {
                (0, errorUtils_1.throwServerError)(error);
            }
            // Save post ref to site
            site.posts = [...site.posts, newPost._id];
            try {
                yield site.save();
            }
            catch (error) {
                // Delete post if there was an error
                try {
                    yield post_1.Post.findOneAndDelete({ _id: newPost._id });
                }
                catch (deletePostError) {
                    (0, errorUtils_1.throwServerError)(deletePostError);
                }
                (0, errorUtils_1.throwServerError)(error);
            }
            return `You made a new post! View at:\n${this.siteUrl}/${site.unique}/posts/${newPost._id}`;
        });
    }
    deletePost() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.req)
                throw new dist_1.BadRequest(`deletePost() was given no request.`);
            // Get post id
            const postId = this.messageData;
            // Get and delete post
            let post;
            try {
                post = yield post_1.Post.findOneAndDelete({ _id: postId });
            }
            catch (error) {
                (0, errorUtils_1.throwServerError)(error);
            }
            // Get site
            let site;
            try {
                site = yield site_1.Site.findOne({ phoneNumber: this.req.body.From });
            }
            catch (error) {
                (0, errorUtils_1.throwServerError)(error);
            }
            site.posts = site.posts.filter((pstId) => pstId.toString() !== post._id.toString());
            try {
                yield site.save();
            }
            catch (error) {
                (0, errorUtils_1.throwServerError)(error);
            }
            return `Your post has been deleted.`;
        });
    }
    signupSubscriber() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.req)
                throw new dist_1.BadRequest(`signupSubscriber() was given no request.`);
            if (!this.messageData)
                throw new dist_1.BadRequest(`signupSubscriber() was given no messageData.`);
            const result = yield this.subService.signupPhoneSubscriber(this.req.body.From, this.messageData);
            if (!result)
                return `Sorry, something went wrong! Try again?`;
            if (typeof result === 'string')
                return result;
            if (result.error)
                return result.error;
            return `Yay! You have a new subscriber: ${result.phoneNumber}`;
        });
    }
    signdownSubscriber() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.req)
                throw new dist_1.BadRequest(`signdownSubscriber() was given no request.`);
            if (!this.messageData)
                throw new dist_1.BadRequest(`signdownSubscriber() was given no messageData.`);
            const result = yield this.subService.signdownPhoneSubscriber(this.req.body.From, this.messageData);
            if (!result)
                return `Sorry, something went wrong! Try again?`;
            if (typeof result === 'string')
                return result;
            if (result.error)
                return result.error;
            return `Unsubscribed: ${result.phoneNumber} ..It's okay. There are plenty of fish in the sea.`;
        });
    }
    areYouSureDelete() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.req)
                throw new dist_1.BadRequest(`areYouSureDelete() was given no request.`);
            // Get site and stage for deletion
            let site;
            try {
                site = yield site_1.Site.findOneAndUpdate({ phoneNumber: this.req.body.From }, { stagedForDeletion: true });
            }
            catch (error) {
                (0, errorUtils_1.throwServerError)(error);
            }
            return `Are you sure you want to delete your site?\nYou'll lose all your data, and there's no getting it back!\nTo delete respond with: cmd death ${site.unique}`;
        });
    }
    forRealDelete() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.req)
                throw new dist_1.BadRequest(`forRealDelete() was given no request.`);
            // Get site
            let site;
            try {
                site = yield site_1.Site.findOne({ phoneNumber: this.req.body.From });
            }
            catch (error) {
                (0, errorUtils_1.throwServerError)(error);
            }
            // check for staged for deletion
            if (!site.stagedForDeletion)
                return this.areYouSureDelete();
            // Check for delete confirmation
            const confirmation = this.messageData;
            if (confirmation !== site.unique)
                return `Yay! You entered the command in wrong.\nTo permanently delete, send EXACTLY:\ncmd death ${site.unique}`;
            // Delete all posts by site
            try {
                yield post_1.Post.deleteMany({ site: site._id });
            }
            catch (error) {
                (0, errorUtils_1.throwServerError)(error);
            }
            // delete site
            try {
                yield site_1.Site.findOneAndDelete({ phoneNumber: this.req.body.From });
                return `Sadly, your site has been deleted.\nJust text this number again to create a new site!`;
            }
            catch (error) {
                (0, errorUtils_1.throwServerError)(error);
            }
        });
    }
    sendHelp() {
        if (!this.messageData)
            throw new dist_1.BadRequest(`sendHelp() was given no messageData.`);
        const data = (this.messageData).toLowerCase();
        if (data === 'commands' || data === 'command' || data === 'cmd' || data === 'cmds')
            return `Commands:\n${this.availableCommands.join('\n')}`;
        return `Visit ${this.helpSiteUrl}/ for further help.`;
    }
    updateAccount() {
        return `Visit this link to update your account: ${this.siteUrl}/account`;
    }
}
exports.WriteSiteService = WriteSiteService;
