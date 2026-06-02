import {setGlobalOptions} from "firebase-functions";
import {onRequest} from "firebase-functions/https";
import * as logger from "firebase-functions/logger";

setGlobalOptions({maxInstances: 10});

export const ping = onRequest((req, res) => {
  logger.info("Ping received", {url: req.url});
  res.send("Pong!");
});