import express from "express";
import sqlite3 from "sqlite3";
import crypto from "crypto";

import { createCookie } from "./utils.js";
import { getEndpointsFromUrl, getToken } from "./micropub.js";

const clientId = process.env["CLIENT_ID"] || "http://localhost:3000";
const redirectUri =
  process.env["REDIRECT_URI"] || "http://localhost:3000/auth/success";

// Open a database
const db = new sqlite3.Database("./client.db");
db.run(
  "CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY_KEY, token TEXT, me TEXT)"
);

const app = express();

app.post("/", async function (req, res) {
  const { me } = req.parsedBody;
  const endpoints = await getEndpointsFromUrl(me);

  const authorization_endpoint = endpoints.find(
    (endpoint) => endpoint.rel === "authorization_endpoint"
  );

  if (!authorization_endpoint) {
    throw new Error("Couldn't find authorization endpoint.");
  }

  const hash = crypto.createHash("md5");
  hash.update(clientId);
  hash.update(redirectUri);
  const state = hash.toString();

  const params = new URLSearchParams({
    me,
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    state,
  });

  const url = new URL(authorization_endpoint.href);
  url.search = `${params.toString()}&scope=create+update+media`; // TODO: Request scope correctly

  res.redirect(url.toString());
});

app.get("/success", async function (req, res) {
  const { code, me, state } = req.query;

  const compareState = createHash("sha256");
  compareState.update(clientId);
  compareState.update(redirectUri);
  if (state !== compareState.toString()) {
    throw new Error("State variable doesn't match given state");
  }

  const endpoints = await getEndpointsFromUrl(me);
  const token_endpoint = endpoints.find(
    (endpoint) => endpoint.rel === "token_endpoint"
  );
  if (!token_endpoint) {
    throw new Error("Couldn't find token endpoint.");
  }

  const token = await getToken({
    me,
    clientId,
    redirectUri,
    url: token_endpoint.href,
    code,
  });

  const hash = createHash("sha256");
  hash.update(code);
  hash.update(me);

  const id = hash.toString();

  db.run("INSERT INTO sessions VALUES(?, ?, ?)", [id, token, me]);

  res.set("Set-Cookie", createCookie("session", id, req.secure));
  res.redirect("/");
});

export default app;
