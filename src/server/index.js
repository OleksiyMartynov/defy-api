import "dotenv/config";

import models from "../models";
import routes from "../routes";
import cors from "cors";
import bodyParser from "body-parser";
import express from "express";
import logging from "../middleware/Logger";
import requestIp from "request-ip";

const app = express();

app.set('trust proxy', true);
app.use(requestIp.mw())
app.use(cors({credentials: true, origin: ["https://40b31b7c873b.ngrok.io/", 'http://localhost:3000']}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(logging);

app.use((req, res, next) => {
  req.context = {
    models,
  };
  next();
});

app.use("/login", routes.login);
app.use("/payment", routes.payment);
app.use("/accounts", routes.account);
app.use("/debates", routes.debate);
app.use("/opinions", routes.opinion);
app.use("/tags", routes.tag);
app.use("/meta", routes.meta);

app.get("/", (req, res) => {
  res.json({ status: true });
});

module.exports = app;
