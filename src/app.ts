import express, {
    Response as ExResponse,
    Request as ExRequest,
    NextFunction,
} from "express";
import bodyParser from "body-parser";
import { RegisterRoutes } from "../dist/routes";
import { ValidateError, } from "tsoa";
const cors = require('cors')

export const app = express();

// Use body parser to read sent json payloads
// Cross origin requests ==/
app.use(cors())
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);
app.use(bodyParser.json());

RegisterRoutes(app);

app.use(function notFoundHandler(_req, res: ExResponse) {
    res.status(404).send({
        message: "Route Not Found",
    });
});

app.use(function errorHandler(
    err: unknown,
    req: ExRequest,
    res: ExResponse,
    next: NextFunction
): ExResponse | void {
    if (err instanceof ValidateError) {
        console.warn(`Caught Validation Error for ${req.path}:`, err.fields);
        return res.status(422).json({
            message: "Validation Failed",
            details: err?.fields,
        });
    }
    if (err instanceof Error) {
        return res.status(500).json({
            message: "Internal Server Error",
        });
    }

    next();
});