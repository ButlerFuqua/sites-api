const express = require('express')
const router = express.Router()


// Home route
router.get(`/`, (req, res, next) => res.status(200).json({ success: true, message: `API home route` }))

// Write Sites
router.use(`/sites`, require('./siteController'))
// Read Sites
router.use(`/read`, require('./readController'))



module.exports = router