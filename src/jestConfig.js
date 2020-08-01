import dotenv from "dotenv";
import "regenerator-runtime/runtime";
const fs = require("fs");
const envConfig = dotenv.parse(fs.readFileSync(".env.test.txt"));
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

jest.setTimeout(60000);
