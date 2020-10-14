import opine from "https://deno.land/x/opine@0.21.2/mod.ts";
import { createHash } from "https://deno.land/std/hash/mod.ts";
import { DB } from "https://deno.land/x/sqlite/mod.ts";

import { createCookie } from "./utils.ts";
import { Rel, getEndpointsFromUrl, getToken } from "./micropub.ts";

const clientId = Deno.env.get("CLIENT_ID") || "http://localhost:3000";
const redirectUri =
  Deno.env.get("REDIRECT_URI") || "http://localhost:3000/auth/success";

// Open a database
const db = new DB("./client.db");
db.query(
  "CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY_KEY, token TEXT, me TEXT)"
);

const app = opine();

app.post("/", async function (req, res) {
  const { me } = req.parsedBody;
  const endpoints = await getEndpointsFromUrl(me);

  const authorization_endpoint = endpoints.find(
    (endpoint: Rel) => endpoint.rel === "authorization_endpoint"
  );

  if (!authorization_endpoint) {
    throw new Error("Couldn't find authorization endpoint.");
  }

  const hash = createHash("md5");
  hash.update(clientId);
  hash.update(redirectUri);
  const state = hash.toString();

  const params = new URLSearchParams({
    me,
    client_id: clientId!,
    redirect_uri: redirectUri!,
    response_type: "code",
    state,
  });

  const url = new URL(authorization_endpoint.href);
  url.search = `${params.toString()}&scope=create+update+media`; // TODO: Request scope correctly

  res.redirect(url.toString());
});

app.get("/success", async function (req, res) {
  const { code, me, state } = req.query;

  const compareState = createHash("md5");
  compareState.update(clientId);
  compareState.update(redirectUri);
  if (state !== compareState.toString()) {
    throw new Error("State variable doesn't match given state");
  }

  const endpoints = await getEndpointsFromUrl(me);
  const token_endpoint = endpoints.find(
    (endpoint: Rel) => endpoint.rel === "token_endpoint"
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

  const hash = createHash("md5");
  hash.update(code);
  hash.update(me);

  const id = hash.toString();

  db.query("INSERT INTO sessions VALUES(?, ?, ?)", [id, token, me]);

  res.set("Set-Cookie", createCookie("session", id, req.secure));
  res.redirect("/");
});

export default app;
