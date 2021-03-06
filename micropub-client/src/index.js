import express from "express";
import sqlite3 from "sqlite3";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";

import authentication from "./authentication.js";
import { getCookie } from "./utils.js";
import { getEndpointsFromUrl } from "./micropub.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env["PORT"]) || 3000;

const render = (res, filename) =>
  res.sendFile(filename, { root: join(__dirname, "../views") });

// Open a database
const db = new sqlite3.Database("./client.db");
db.run(
  "CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY_KEY, token TEXT, me TEXT)"
);

const app = express();

app.use(express.static("../public"));
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

app.get("/", async function (req, res) {
  const sessionId = getCookie(req.headers.cookie || "", "session");
  const { token } = await getToken(sessionId);
  if (token) {
    return render(res, "index.html");
  }
  return render(res, "login.html");
});

app.post("/post", async function (req, res) {
  const { in_reply_to, note } = req.body;
  const sessionId = getCookie(req.headers.cookie || "", "session");
  const { token, me } = await getToken(sessionId);
  if (token) {
    const endpoints = await getEndpointsFromUrl(me);
    const micropub_endpoint = endpoints.find(
      (endpoint) => endpoint.rel === "micropub"
    );

    if (!micropub_endpoint) {
      throw new Error("Couldn't find micropub endpoint.");
    }

    const body = JSON.stringify({
      h: "entry",
      content: note,
      in_reply_to,
    });

    const response = await fetch(micropub_endpoint.href, {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const location = response.headers.get("Location");
    return res.redirect(location || "/");
  }
  return render(res, "404.html");
});

async function dbGet(statement, variables) {
  return new Promise((resolve, reject) => {
    db.get(statement, variables, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

async function getToken(sessionId) {
  const results = await dbGet("SELECT token, me FROM sessions WHERE id = ?", [
    sessionId,
  ]);
  if (results) {
    const { token, me } = results;
    return { token, me };
  }
  return { token: "", me: "" };
}

app.use("/auth", authentication);

console.log(`Listening on port ${PORT}.`);
app.listen(PORT);
