import { Application, Request, Response, NextFunction } from 'express'
import { config } from "./config"

const mediasoup = require("mediasoup")
const express = require("express")
const https = require("https")
const http = require("http")
const fs = require("fs")

const app: Application = express()

/**
 * Initialize the project.
 */
function init() {
    // Enable https: https://expressjs.com/en/5x/api.html#app.listen
    try {
        const credentials = {
            key: fs.readFileSync(config.sslKeyPath, "utf-8"), 
            cert: fs.readFileSync(config.sslCertPath, "utf-8")
        }
        https.createServer(credentials, app)
            .listen(config.listenIp, config.listenPort, () => {
                console.log(`Server running on HTTPS: http://${config.listenIp}:${config.listenPort}`)
            })
    } catch (e) {
        console.error(`[HTTPS] ${e}`)
        app.listen(config.listenPort, config.listenIp, () => {
                console.log(`Server running on HTTP: http://${config.listenIp}:${config.listenPort}`)
            })
    }
}

init()

app.post("/post", async (req: Request, res: Response) => {
    console.log(req.body);
    res.send("hello, world");
});

// try this to see: 
// http://localhost:3000/hello?query1=123&q2=456
// http://localhost:3000/hello/
// http://localhost:3000/hello/?query1=123&q2=456
// http://localhost:3000/hello/world?query1=123&q2=456
app.get("/hello", async (req: Request, res: Response, next: NextFunction) => {
    console.log("1")
    console.log(req.url);
    next()      // pass control to the next handler
});

app.get("/hello/:name?", async (req: Request, res: Response) => {
    console.log("2")
    console.log(req.query);
    console.log(req.params);
    res.send(`hello, ${req.params.name}!`);
});

