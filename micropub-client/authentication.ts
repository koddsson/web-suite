import opine from "https://deno.land/x/opine@0.21.2/mod.ts";
import { getEndpointsFromUrl, getToken } from "./micropub.ts";
import { createHash } from "https://deno.land/std/hash/mod.ts";
import { DB } from "https://deno.land/x/sqlite/mod.ts";
import { createCookie } from "./utils.ts";

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
  const { authorization_endpoint } = await getEndpointsFromUrl(me);

  const params = new URLSearchParams({
    me,
    client_id: clientId!,
    redirect_uri: redirectUri!,
    response_type: "code",
    state: "state", // TODO: Generate this better
  });

  const url = new URL(authorization_endpoint);
  url.search = `${params.toString()}&scope=create+update+media`; // TODO: Request scope correctly

  res.redirect(url.toString());
});

app.get("/success", async function (req, res) {
  const { code, me, state } = req.query;
  const { token_endpoint } = await getEndpointsFromUrl(me);
  const token = await getToken({
    me,
    clientId,
    redirectUri,
    url: token_endpoint,
    code,
  });

  // TODO: I need to do something clever with state.
  console.log(state);
  const hash = createHash("md5");
  hash.update(code);
  hash.update(me);
  const id = hash.toString();

  db.query("INSERT INTO sessions VALUES(?, ?, ?)", [id, token, me]);

  res.set("Set-Cookie", createCookie("session", id, req.secure));
  res.redirect("/");
});

export default app;
