const { config, configured, googleFetch, json } = require("./_lib");

function clean(value, max = 50000) {
  return String(value ?? "").trim().slice(0, max);
}

function validId(value) {
  const id = clean(value, 200);
  return /^[a-zA-Z0-9_-]{10,}$/.test(id) ? id : "";
}

function bodyContent(document) {
  return document.body?.content || document.tabs?.[0]?.documentTab?.body?.content || [];
}

function textFromElements(elements = []) {
  return elements.map((element) => {
    if (element.paragraph) return (element.paragraph.elements || []).map((item) => item.textRun?.content || "").join("");
    if (element.table) return (element.table.tableRows || []).map((row) => (row.tableCells || []).map((cell) => textFromElements(cell.content)).join("\t")).join("\n");
    if (element.tableOfContents) return textFromElements(element.tableOfContents.content);
    return "";
  }).join("");
}

function endIndex(document) {
  const content = bodyContent(document);
  return Number(content[content.length - 1]?.endIndex || 1);
}

function formatRequests(paragraphs, textLength) {
  if (!Array.isArray(paragraphs)) return [];
  return paragraphs.slice(0, 500).map((paragraph) => {
    const startIndex = Math.max(1, Math.min(textLength, Number(paragraph.startIndex || 1)));
    const end = Math.max(startIndex, Math.min(textLength + 1, Number(paragraph.endIndex || startIndex)));
    const namedStyleType = ["TITLE", "SUBTITLE", "HEADING_1", "HEADING_2", "HEADING_3", "NORMAL_TEXT"].includes(paragraph.namedStyleType) ? paragraph.namedStyleType : "NORMAL_TEXT";
    return { updateParagraphStyle: { range: { startIndex, endIndex: end }, paragraphStyle: { namedStyleType }, fields: "namedStyleType" } };
  });
}

async function metadata(request, documentId) {
  return googleFetch(request, `https://www.googleapis.com/drive/v3/files/${documentId}?supportsAllDrives=true&fields=id,name,webViewLink,createdTime,modifiedTime,capabilities(canEdit,canComment,canShare)`);
}

async function comments(request, documentId) {
  const fields = encodeURIComponent("comments(id,content,htmlContent,createdTime,modifiedTime,resolved,author(displayName,photoLink,me),replies(id,content,htmlContent,createdTime,modifiedTime,deleted,action,author(displayName,photoLink,me)))");
  const payload = await googleFetch(request, `https://www.googleapis.com/drive/v3/files/${documentId}/comments?pageSize=100&includeDeleted=false&fields=${fields}`);
  return payload.comments || [];
}

async function writeDocument(request, documentId, text, paragraphs, replace) {
  const current = replace ? await googleFetch(request, `https://docs.googleapis.com/v1/documents/${documentId}?includeTabsContent=true`) : null;
  const requests = [];
  if (replace) {
    const end = endIndex(current);
    if (end > 2) requests.push({ deleteContentRange: { range: { startIndex: 1, endIndex: end - 1 } } });
  }
  requests.push({ insertText: { location: { index: 1 }, text } }, ...formatRequests(paragraphs, text.length));
  const payload = { requests };
  if (replace && current?.revisionId) payload.writeControl = { requiredRevisionId: current.revisionId };
  await googleFetch(request, `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, { method: "POST", body: JSON.stringify(payload) });
}

async function handleGet(request, response) {
  const documentId = validId(request.query?.id);
  if (!documentId) return json(response, 400, { error: "Google document ID không hợp lệ." });
  const [document, file, fileComments] = await Promise.all([
    googleFetch(request, `https://docs.googleapis.com/v1/documents/${documentId}?includeTabsContent=true`),
    metadata(request, documentId),
    String(request.query?.comments || "") === "1" ? comments(request, documentId) : Promise.resolve([]),
  ]);
  return json(response, 200, { document: { id: file.id, name: file.name, url: file.webViewLink, modifiedTime: file.modifiedTime, capabilities: file.capabilities, text: textFromElements(bodyContent(document)), revisionId: document.revisionId }, comments: fileComments });
}

async function handlePost(request, response) {
  const body = typeof request.body === "string" ? JSON.parse(request.body) : (request.body || {});
  const action = clean(body.action, 20);
  if (action === "create") {
    const title = clean(body.title, 200) || "DOL Content";
    const text = clean(body.text, 100000);
    if (!text) return json(response, 400, { error: "Nội dung Google Doc đang trống." });
    const value = config();
    const file = await googleFetch(request, "https://www.googleapis.com/drive/v3/files?supportsAllDrives=true&fields=id,name,webViewLink,createdTime,modifiedTime", { method: "POST", body: JSON.stringify({ name: title, mimeType: "application/vnd.google-apps.document", ...(value.folderId ? { parents: [value.folderId] } : {}) }) });
    await writeDocument(request, file.id, `${text.trim()}\n`, body.paragraphs, false);
    const updated = await metadata(request, file.id);
    return json(response, 201, { document: { id: updated.id, name: updated.name, url: updated.webViewLink, modifiedTime: updated.modifiedTime, capabilities: updated.capabilities } });
  }

  const documentId = validId(body.documentId);
  if (!documentId) return json(response, 400, { error: "Google document ID không hợp lệ." });
  if (action === "update") {
    const text = clean(body.text, 100000);
    if (!text) return json(response, 400, { error: "Nội dung đồng bộ đang trống." });
    await writeDocument(request, documentId, `${text.trim()}\n`, body.paragraphs, true);
    const title = clean(body.title, 200);
    if (title) await googleFetch(request, `https://www.googleapis.com/drive/v3/files/${documentId}?supportsAllDrives=true&fields=id`, { method: "PATCH", body: JSON.stringify({ name: title }) });
    const file = await metadata(request, documentId);
    return json(response, 200, { document: { id: file.id, name: file.name, url: file.webViewLink, modifiedTime: file.modifiedTime, capabilities: file.capabilities } });
  }
  if (action === "comment") {
    const content = clean(body.content, 5000);
    if (!content) return json(response, 400, { error: "Comment đang trống." });
    const fields = encodeURIComponent("id,content,htmlContent,createdTime,modifiedTime,resolved,author(displayName,photoLink,me)");
    const comment = await googleFetch(request, `https://www.googleapis.com/drive/v3/files/${documentId}/comments?fields=${fields}`, { method: "POST", body: JSON.stringify({ content }) });
    return json(response, 201, { comment });
  }
  if (action === "reply") {
    const commentId = validId(body.commentId);
    const content = clean(body.content, 5000);
    if (!commentId || !content) return json(response, 400, { error: "Reply không hợp lệ." });
    const reply = await googleFetch(request, `https://www.googleapis.com/drive/v3/files/${documentId}/comments/${commentId}/replies?fields=id,content,createdTime,modifiedTime,action,author(displayName,photoLink,me)`, { method: "POST", body: JSON.stringify({ content, ...(body.resolve ? { action: "resolve" } : {}) }) });
    return json(response, 201, { reply });
  }
  return json(response, 400, { error: "Google Docs action không hợp lệ." });
}

module.exports = async function handler(request, response) {
  if (!configured()) return json(response, 503, { error: "Google OAuth chưa được cấu hình trên server." });
  try {
    if (request.method === "GET") return await handleGet(request, response);
    if (request.method === "POST") return await handlePost(request, response);
    return json(response, 405, { error: "Method not allowed." });
  } catch (error) {
    return json(response, error.status || 500, { error: error.message || "Google Docs integration gặp lỗi." });
  }
};
