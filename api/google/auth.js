const crypto = require("crypto");
const { config, configured, redirectUri, setStateCookie, json } = require("./_lib");

module.exports = async function handler(request, response) {
  if (request.method !== "GET") return json(response, 405, { error: "Method not allowed." });
  if (!configured()) return json(response, 503, { error: "Google OAuth chưa được cấu hình trên server." });
  const state = crypto.randomBytes(24).toString("base64url");
  setStateCookie(response, state);
  const params = new URLSearchParams({
    client_id: config().clientId,
    redirect_uri: redirectUri(),
    response_type: "code",
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "consent",
    state,
    scope: [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/documents",
      config().driveScope,
    ].join(" "),
  });
  response.setHeader("Cache-Control", "no-store, max-age=0");
  return response.redirect(302, `https://accounts.google.com/o/oauth2/v2/auth?${params}`);
};
