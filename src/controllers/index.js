const express = require('express')
const router = express.Router()


// Home route
router.get(`/`, (req, res, next) => res.status(200).json({ success: true, message: `API home route` }))

// Users
router.use(`/sites`, require('./siteController'))



module.exports = router