const crypto = require("crypto");
const { config, configured, redirectUri, stateFromRequest, clearStateCookie, setTokenCookie, tokenExchange, json } = require("./_lib");

function equal(left, right) {
  const a = Buffer.from(String(left || ""));
  const b = Buffer.from(String(right || ""));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = async function handler(request, response) {
  if (request.method !== "GET") return json(response, 405, { error: "Method not allowed." });
  if (!configured()) return json(response, 503, { error: "Google OAuth chưa được cấu hình trên server." });
  const query = request.query || {};
  const expectedState = stateFromRequest(request);
  clearStateCookie(response);
  if (!query.code || !equal(query.state, expectedState)) return json(response, 400, { error: "Google OAuth state không hợp lệ. Hãy kết nối lại." });
  try {
    const value = config();
    const tokens = await tokenExchange({ client_id: value.clientId, client_secret: value.clientSecret, code: String(query.code), grant_type: "authorization_code", redirect_uri: redirectUri() });
    if (!tokens.refresh_token) throw new Error("Google không trả refresh token. Hãy thu hồi quyền ứng dụng rồi kết nối lại.");
    setTokenCookie(response, tokens);
    return response.redirect(302, `${value.baseUrl}?google=connected#content/writer`);
  } catch (error) {
    return json(response, 502, { error: error.message || "Không thể hoàn tất Google OAuth." });
  }
};
