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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const readSiteService_1 = require("../services/readSiteService");
const readSiteService = new readSiteService_1.ReadSiteService();
// Index ==/
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { skip, limit } = req.query;
    const sites = yield readSiteService.getSites(null, skip, limit);
    if (sites.error)
        return res.status(sites.status).json({ error: sites.error });
    res.status(200).json({ sites });
}));
// Get one Site ==/
router.get('/:unique', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const site = yield readSiteService.getOneSite(req.params.unique);
    if (!site)
        return res.status(400).json({ error: `No site found for ${req.params.unique}` });
    if (site.error)
        return res.status(site.status).json({ error: site.error });
    res.status(200).json({ site });
}));
// Get posts ==/
router.get('/:id/posts', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { skip, limit } = req.query;
    const posts = yield readSiteService.getSitePosts(req.params.id, skip, limit);
    res.status(200).json({ posts });
}));
// Read One Post ==/
router.get('/posts/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const post = yield readSiteService.getOnePost(req.params.id);
    res.status(200).json({ post });
}));
// Read Accounts ==/
router.get('/available/accounts', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const accounts = yield readSiteService.getAccounts();
    res.status(200).json({ accounts });
}));
module.exports = router;
