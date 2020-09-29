import { Router } from "express";
import models from "../models";
import cookieParser from "cookie-parser";
import { verifyPubKey } from "../middleware/SignatureVerifier";
import { verifySignature } from "../service/LightningService";
import Middleware from "../middleware/LnUrlAuthMiddleware";
const session = require("express-session");
const LnurlAuth = require("passport-lnurl-auth");
var passport = require("passport"),
  LocalStrategy = require("passport-local").Strategy;

const router = Router();

router.use(
  session({
    secret: "1adf23fafr45s",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, httpOnly: false },
  })
);

router.use(cookieParser());

router.use(passport.initialize()); // Used to initialize passport
router.use(passport.session()); // Used to persist login sessions

passport.serializeUser(function (user, done) {
  console.log({ msg: "serialize", user });
  done(null, user.address);
});

passport.deserializeUser(async function (id, done) {
  console.log({ msg: "deserialize", id });
  let user = await models.Account.accountForAddress(id);
  done(null, user);
});

passport.use(
  new LnurlAuth.Strategy(async function (linkingPublicKey, done) {
    console.log("LnurlAuth.Strategy");
    console.log(linkingPublicKey);
    let user = await models.Account.accountForAddress(linkingPublicKey);
    if (!user) {
      user = await models.Account.create({
        address: linkingPublicKey,
        balance: 0,
        keyType: "lnurl-auth",
      });
    }
    done(null, user);
  })
);

passport.use(
  new LocalStrategy(
    {
      usernameField: "payload",
      passwordField: "signature",
    },
    async function (username, password, done) {
      console.log({ username, password });
      const [type, address, message] = username.split(",");
      if(type==="webln"){
        console.log({type, address, message})
        const isValidResp = await verifySignature(message, password);
        console.log(isValidResp);
        if(isValidResp.valid){
          console.log("valid sig");
          let user = await models.Account.accountForAddress(isValidResp.pubkey);
          if (!user) {
            user = await models.Account.create({
              address: isValidResp.pubkey,
              balance: 0,
              keyType: "webln",
            });
          }
          done(null, user);
        } else {
          console.log("invalid sig");
          done(null, false, { message: "Could not verify signature." });
        }
      }else{
        const isValid = await verifyPubKey(address, password, message);
        if (isValid) {
          console.log("valid sig");
          let user = await models.Account.accountForAddress(username);
          if (!user) {
            user = await models.Account.create({
              address: address,
              balance: 0,
              keyType: "custom",
            });
          }
          done(null, user);
        } else {
          console.log("invalid sig");
          done(null, false, { message: "Could not verify signature." });
        }
      }
    }
  )
);

//router.use(passport.authenticate("lnurl-auth")); //uncomment for lnurl auth

router.get(
  "/login-lnurl",
  passport.authenticate("lnurl-auth"),
  function (req, res, next) {
    if (req.user) {
      return res.send({ data: { user: req.user } });
    }
    next();
  },
  new Middleware({
    callbackUrl: "https://46a6c70b9ef5.ngrok.io/api/login/login-lnurl",
    cancelUrl: "http://localhost:3000",
  })
);
// more info here  https://medium.com/free-code-camp/how-to-set-up-twitter-oauth-using-passport-js-and-reactjs-9ffa6f49ef0
router.post(
  "/login-custom",
  passport.authenticate("local", {
    successRedirect: "https://46a6c70b9ef5.ngrok.io/api/login/logged-in",
    failureRedirect: "https://google.com",
    failureFlash: false,
  })
);

router.get("/logged-in", (req, res) => {
  console.log({
    sessionID: req.sessionID,
    session: req.session,
    user: req.user,
  });

  req.session.name = "hello session";
  res.send({ data: { user: req.user } });
});

router.get("/logout", (req, res) => {
  req.logout();
  req.session.destroy();
  res.send({status:"logged-out"})
})

export default router;
