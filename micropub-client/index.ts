import opine, {
  urlencoded,
  serveStatic,
} from "https://deno.land/x/opine@0.21.2/mod.ts";
import { renderFileToString } from "https://deno.land/x/dejs@0.8.0/mod.ts";
import { DB } from "https://deno.land/x/sqlite/mod.ts";
import { dirname, join } from "https://deno.land/std@0.73.0/path/mod.ts";
import authentication from "./authentication.ts";
import { getCookie } from "./utils.ts";
import { Rel, getEndpointsFromUrl } from "./micropub.ts";

const PORT = Number(Deno.env.get("PORT")) || 3000;

// Open a database
const db = new DB("./client.db");
db.query(
  "CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY_KEY, token TEXT, me TEXT)"
);

const app = opine();

const __dirname = dirname(import.meta.url);
app.use(serveStatic(join(__dirname, "public")));
app.use(urlencoded());
app.engine(".html", renderFileToString);

app.get("/", async function (req, res) {
  const sessionId = getCookie(req.headers.get("Cookie") || "", "session");
  const { token } = getToken(sessionId);
  if (token) {
    return res.render("index.html");
  }
  return res.render("login.html");
});

app.post("/post", async function (req, res) {
  const { in_reply_to, note } = req.parsedBody;
  const sessionId = getCookie(req.headers.get("Cookie") || "", "session");
  const { token, me } = getToken(sessionId);
  if (token) {
    const endpoints = await getEndpointsFromUrl(me);
    const micropub_endpoint = endpoints.find(
      (endpoint: Rel) => endpoint.rel === "micropub"
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
  return res.render("404.html");
});

function getToken(sessionId: string): { token: string; me: string } {
  const results = [
    ...db
      .query("SELECT token, me FROM sessions WHERE id = ?", [sessionId])
      .asObjects(),
  ][0];
  if (results) {
    const { token, me } = results;
    return { token, me };
  }
  return { token: "", me: "" };
}

app.use("/auth", authentication);

console.log(`Listening on port ${PORT}.`);
app.listen(PORT);
