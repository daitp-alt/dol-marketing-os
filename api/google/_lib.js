const crypto = require("crypto");

const TOKEN_COOKIE = "dol_google_tokens";
const STATE_COOKIE = "dol_google_oauth_state";

function config() {
  return {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    encryptionKey: process.env.GOOGLE_TOKEN_ENCRYPTION_KEY || "",
    folderId: process.env.GOOGLE_DRIVE_FOLDER_ID || "",
    driveScope: process.env.GOOGLE_DRIVE_SCOPE === "drive" ? "https://www.googleapis.com/auth/drive" : "https://www.googleapis.com/auth/drive.file",
    baseUrl: String(process.env.PUBLIC_APP_URL || "https://mkt.dolenglish.us/seo").replace(/\/$/, ""),
  };
}

function configured() {
  const value = config();
  return Boolean(value.clientId && value.clientSecret && value.encryptionKey);
}

function redirectUri() {
  return process.env.GOOGLE_REDIRECT_URI || `${config().baseUrl}/api/google/callback`;
}

function parseCookies(request) {
  return String(request.headers?.cookie || "").split(";").reduce((cookies, item) => {
    const index = item.indexOf("=");
    if (index < 0) return cookies;
    cookies[item.slice(0, index).trim()] = decodeURIComponent(item.slice(index + 1).trim());
    return cookies;
  }, {});
}

function cookie(name, value, maxAge) {
  const secure = process.env.GOOGLE_COOKIE_SECURE !== "false";
  return `${name}=${encodeURIComponent(value)}; Path=/seo; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? "; Secure" : ""}`;
}

function appendCookie(response, value) {
  const current = response.getHeader?.("Set-Cookie");
  response.setHeader("Set-Cookie", current ? [].concat(current, value) : value);
}

function encryptionKey() {
  const secret = config().encryptionKey;
  if (!secret) throw new Error("GOOGLE_TOKEN_ENCRYPTION_KEY chưa được cấu hình.");
  return crypto.createHash("sha256").update(secret).digest();
}

function encrypt(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64url");
}

function decrypt(value) {
  try {
    const payload = Buffer.from(String(value || ""), "base64url");
    const iv = payload.subarray(0, 12);
    const tag = payload.subarray(12, 28);
    const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), iv);
    decipher.setAuthTag(tag);
    return JSON.parse(Buffer.concat([decipher.update(payload.subarray(28)), decipher.final()]).toString("utf8"));
  } catch { return null; }
}

function setStateCookie(response, state) {
  appendCookie(response, cookie(STATE_COOKIE, state, 600));
}

function clearStateCookie(response) {
  appendCookie(response, cookie(STATE_COOKIE, "", 0));
}

function stateFromRequest(request) {
  return parseCookies(request)[STATE_COOKIE] || "";
}

function setTokenCookie(response, tokens) {
  const normalized = {
    access_token: tokens.access_token || "",
    refresh_token: tokens.refresh_token || "",
    expires_at: Date.now() + Math.max(60, Number(tokens.expires_in || 3600)) * 1000,
  };
  appendCookie(response, cookie(TOKEN_COOKIE, encrypt(normalized), 60 * 60 * 24 * 30));
}

function clearTokenCookie(response) {
  appendCookie(response, cookie(TOKEN_COOKIE, "", 0));
}

function tokensFromRequest(request) {
  return decrypt(parseCookies(request)[TOKEN_COOKIE]);
}

async function tokenExchange(params) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error_description || payload.error || "Google OAuth từ chối yêu cầu.");
  return payload;
}

async function accessToken(request) {
  const tokens = tokensFromRequest(request);
  if (!tokens) return null;
  if (tokens.access_token && Number(tokens.expires_at) > Date.now() + 60000) return tokens.access_token;
  if (!tokens.refresh_token) return null;
  const value = config();
  const refreshed = await tokenExchange({ client_id: value.clientId, client_secret: value.clientSecret, refresh_token: tokens.refresh_token, grant_type: "refresh_token" });
  return refreshed.access_token || null;
}

async function googleFetch(request, url, options = {}) {
  const token = await accessToken(request);
  if (!token) {
    const error = new Error("Google Workspace chưa được kết nối hoặc phiên đã hết hạn.");
    error.status = 401;
    throw error;
  }
  const response = await fetch(url, { ...options, headers: { Authorization: `Bearer ${token}`, ...(options.body ? { "Content-Type": "application/json" } : {}), ...(options.headers || {}) } });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error?.message || "Google API từ chối yêu cầu.");
    error.status = response.status;
    throw error;
  }
  return payload;
}

function json(response, status, payload) {
  response.setHeader("Cache-Control", "no-store, max-age=0");
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  return response.status(status).json(payload);
}

module.exports = { config, configured, redirectUri, setStateCookie, clearStateCookie, stateFromRequest, setTokenCookie, clearTokenCookie, tokensFromRequest, tokenExchange, accessToken, googleFetch, json };
