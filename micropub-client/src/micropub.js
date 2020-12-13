// TODO: Fix all these imports
//import { findAll } from "https://raw.githubusercontent.com/koddsson/deno-htmlparser2/master/domutils/querying.ts";
//import type { Element } from "https://raw.githubusercontent.com/koddsson/deno-htmlparser2/master/domhandler/index.ts";

import fetch from "node-fetch";
import pkg from "node-html-parser";
const { parse } = pkg;

export async function getToken({ me, clientId, redirectUri, url, code }) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    me,
    code,
    client_id: clientId,
    redirect_uri: redirectUri,
  }).toString();

  const res = await fetch(url, {
    method: "POST",
    body,
    headers: {
      "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
      accept: "application/json, application/x-www-form-urlencoded",
    },
  });

  let results = {};

  if (res.headers.get("Content-Type") === "application/x-www-form-urlencoded") {
    const entries = new URLSearchParams(await res.text()).entries();
    for (const [key, value] of entries) {
      results[key] = value;
    }
  } else if (res.headers.get("Content-Type") === "application/json") {
    results = await res.json();
  }

  if (results.error_description) {
    throw Error(results.error_description);
  } else if (results.error) {
    throw Error(results.error);
  }
  if (!results.me || !results.scope || !results.access_token) {
    throw Error("The token endpoint did not return the expected parameters");
  }
  // Check "me" values have the same hostname
  const urlResult = new URL(results.me);
  const urlOptions = new URL(me);
  if (urlResult.hostname != urlOptions.hostname) {
    throw Error("The me values do not share the same hostname");
  }

  // Successfully got the token
  return results.access_token;
}

export async function getEndpointsFromUrl(url) {
  // Fetch the given url
  const res = await fetch(url, {
    method: "GET",
    headers: {
      accept: "text/html,application/xhtml+xml",
    },
  });

  const responseText = await res.text();

  const html = parse(responseText);
  const rels = Array.from(html.querySelectorAll("link")).map((element) => {
    const rel = element.getAttribute("rel");
    const href = element.getAttribute("href");

    return { rel, href };
  });

  return rels;
}
