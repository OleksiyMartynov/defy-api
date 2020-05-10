import "dotenv/config";

import models from "../models";
import routes from "../routes";
import cors from "cors";
import bodyParser from "body-parser";
import express from "express";
import logging from '../middleware/Logger';
// import { looper } from "./looper";

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(logging);

app.use((req, res, next) => {
  req.context = {
    models
  };
  next();
});


app.use("/payment", routes.payment);
app.use("/accounts", routes.account);
app.use("/debates", routes.debate);
app.use("/opinions", routes.opinion);
app.use("/tags", routes.tag);

app.get("/", (req, res) => {
  res.json({ status: true });
});


module.exports = app;