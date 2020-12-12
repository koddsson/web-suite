export function createCookie(key, value, inProd = false, expiresInHours = 24) {
  const expires = new Date();
  expires.setHours(expires.getHours() + expiresInHours);

  let cookie = `${key}=${value}; path=/; Expires=${expires.toUTCString()}; HttpOnly`;
  if (inProd) {
    cookie = `${cookie}; Secure; SameSite=Strict`;
  }
  return cookie;
}

/*
 * WARN: This code assumes that there is only one value with each name
 */
export function getCookie(unparsedCookie, name) {
  const cookies = Object.fromEntries(
    unparsedCookie.split(";").map((c) => c.trim().split("="))
  );
  return cookies[name];
}
