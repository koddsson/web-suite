import opine, { urlencoded } from "https://deno.land/x/opine@0.21.2/mod.ts";
import { renderFileToString } from "https://deno.land/x/dejs@0.8.0/mod.ts";
import { DB } from "https://deno.land/x/sqlite/mod.ts";
import authentication from "./authentication.ts";
import { getCookie } from "./utils.ts";

// Open a database
const db = new DB("./client.db");
db.query(
  "CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY_KEY, token TEXT, me TEXT)"
);

const app = opine();
app.engine(".html", renderFileToString);

app.use(urlencoded());

app.get("/", async function (req, res) {
  const sessionId = getCookie(req.headers.get("Cookie") || "", "session");
  const token = getToken(sessionId);
  if (token) {
    return res.render("index.html");
  }
  return res.render("login.html");
});

app.post("/post", async function (req, res) {
  const { note } = req.parsedBody;
  const sessionId = getCookie(req.headers.get("Cookie") || "", "session");
  const token = getToken(sessionId);
  if (token) {
    // TODO: Get the endpoint actually from `me`.
    const body = {
      h: "entry",
      content: note,
    };

    const response = await fetch("https://koddsson.com/micropub", {
      method: "POST",
      body: JSON.stringify(body),
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

function getToken(sessionId: string) {
  const results = [
    ...db
      .query("SELECT token, me FROM sessions WHERE id = ?", [sessionId])
      .asObjects(),
  ][0];
  if (results) {
    return results.token;
  }
}

app.use("/auth", authentication);

console.log("listening on port 3000");
app.listen(3000);
