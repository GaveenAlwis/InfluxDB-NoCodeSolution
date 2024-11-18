import express from "express";
import influxAxios from "../utils/influx-axios.js";


// eslint-disable-next-line new-cap
const router = express.Router();

/* GET users listing. */
router.get("/", function(req, res, next) {
  res.send({message: "respond with a resource"});
});

/**
 * Sends a post request to the InfluxDB server to log into a user session
 * requires request body of the form:
 * {
 *  user="username",
 *  pass="password"
 * }
 *
 * responds with a session token cookie for the InfluxDB server
 */
router.post("/signIn", function(req, res) {
  const {user, pass} = req.body;
  if (!user || !pass) {
    res.status(400).send("Require user or pass");
  }

  const encodedLogin = btoa(`${user}:${pass}`);
  influxAxios.post("/signin", {}, {
    headers: {
      "Authorization": `Basic ${encodedLogin}`,
    },
  })
    .then((response) => {
      res.setHeader("set-cookie", response.headers["set-cookie"]);
      res.status(response.status).send();
    })
    .catch((response) => {
      res.status(response.status).json(response.message);
    });
});


/**
 * Initially for testing the logon script, this is now middleware for the /me API call
 *
 * returns user information for the currently authenticated user.
 */
router.get("/me", function(req, res) {
  influxAxios.get("/me", {
    headers: {
      Cookie: req.headers.cookie,
    },
  })
    .then((response) => {
      res.status(response.status).json(response.data);
    })
    .catch((response) => {
      res.status(response.status).json(response.message);
    });
});


export default router;
