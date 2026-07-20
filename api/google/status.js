const { configured, accessToken, clearTokenCookie, json } = require("./_lib");

module.exports = async function handler(request, response) {
  if (request.method === "DELETE") {
    clearTokenCookie(response);
    return json(response, 200, { connected: false });
  }
  if (request.method !== "GET") return json(response, 405, { error: "Method not allowed." });
  if (!configured()) return json(response, 200, { configured: false, connected: false });
  try {
    const token = await accessToken(request);
    if (!token) return json(response, 200, { configured: true, connected: false });
    const userResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${token}` } });
    const user = await userResponse.json().catch(() => ({}));
    return json(response, 200, { configured: true, connected: true, user: userResponse.ok ? { email: user.email, name: user.name, picture: user.picture } : null });
  } catch {
    clearTokenCookie(response);
    return json(response, 200, { configured: true, connected: false });
  }
};
