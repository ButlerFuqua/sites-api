"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const port = process.env.PORT || 5500;
app_1.app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));
