import express, {
    Response as ExResponse,
    Request as ExRequest,
    NextFunction,
} from "express";
import bodyParser from "body-parser";
import { RegisterRoutes } from "../dist/routes";
import { ValidateError, } from "tsoa";
import { HttpErrorBase } from "@curveball/http-errors/dist";
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
    error: any,
    req: ExRequest,
    res: ExResponse,
    next: NextFunction
): ExResponse | void {
    // TODO add logging to errors

    if (error instanceof ValidateError)
        return res.status(422).json({
            message: "Validation Failed",
            details: error?.fields,
        });

    if (error instanceof HttpErrorBase)
        return res.status(error.httpStatus).json({
            message: error?.message || JSON.stringify(error)
        })

    // TODO make more custom errors with proper status codes
    // if (error instanceof BaseError)
    //     return res.status(500).json({
    //         message: error.message,
    //     });

    // Catch all
    if (error instanceof Error)
        return res.status(500).json({
            message: `Internal Server Error: ${error?.message || JSON.stringify(error)}`,
        });

    next();
});