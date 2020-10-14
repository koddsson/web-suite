// TODO: Fix all these imports
import { parseDOM } from "https://raw.githubusercontent.com/willconant/deno-htmlparser2/20200806_different_event_emitter/htmlparser2/index.ts";
import {
  find,
  findAll,
} from "https://raw.githubusercontent.com/willconant/deno-htmlparser2/20200806_different_event_emitter/domutils/querying.ts";
import type { Element } from "https://raw.githubusercontent.com/willconant/deno-htmlparser2/20200806_different_event_emitter/domhandler/index.ts";

export async function getToken({
  me,
  clientId,
  redirectUri,
  url,
  code,
}: {
  me: string;
  clientId: string;
  redirectUri: string;
  url: string;
  code: string;
}) {
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

  // TODO: Sometimes endpoints can return strging
  // Parse the response from the indieauth server
  // if (typeof result === "string") {
  //   result = qsParse(result);
  // }

  let results: { [key: string]: string } = {};

  if (res.headers.get("Content-Type") === "application/x-www-form-urlencoded") {
    const entries = new URLSearchParams(await res.text()).entries();
    for (const [key, value] of entries) {
      results[key] = value;
    }
  } else if (res.headers.get("Content-Type") === "application/json") {
    results = await res.json();
  }

  if (results.error_description) {
    console.log(results);
    throw Error(results.error_description);
  } else if (results.error) {
    console.log(results);
    throw Error(results.error);
  }
  if (!results.me || !results.scope || !results.access_token) {
    console.log("resultsi: ", JSON.stringify(results));
    throw Error("The token endpoint did not return the expected parameters");
  }
  // Check "me" values have the same hostname
  const urlResult = new URL(results.me);
  const urlOptions = new URL(me);
  if (urlResult.hostname != urlOptions.hostname) {
    throw Error("The me values do not share the same hostname");
  }
  // Successfully got the token
  // TODO: Save this token?
  //  this.options.token = result.access_token;
  return results.access_token;
}

export async function getEndpointsFromUrl(url: string) {
  const endpoints = {
    micropub: "",
    authorization_endpoint: "",
    token_endpoint: "",
  };

  // Fetch the given url
  const res = await fetch(url, {
    method: "GET",
    headers: {
      accept: "text/html,application/xhtml+xml",
    },
  });

  const html = parseDOM(await res.text());
  const rels = findAll((el: Element) => el.tagName === "link", html);

  // TODO: This could be done better I think.
  for (const rel of rels) {
    if (rel.attribs["rel"] === "micropub") {
      endpoints.micropub = rel.attribs["href"];
    }
    if (rel.attribs["rel"] === "token_endpoint") {
      endpoints.token_endpoint = rel.attribs["href"];
    }
    if (rel.attribs["rel"] === "authorization_endpoint") {
      endpoints.authorization_endpoint = rel.attribs["href"];
    }
  }

  if (
    endpoints.micropub &&
    endpoints.authorization_endpoint &&
    endpoints.token_endpoint
  ) {
    return {
      authorization_endpoint: endpoints.authorization_endpoint,
      token_endpoint: endpoints.token_endpoint,
      micropub: endpoints.micropub,
    };
  }

  throw new Error(
    `Error getting microformats data. Endpoints: ${JSON.stringify(endpoints)}`
  );
}
