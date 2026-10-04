/**
 * S3 client for member images (bucket: accbusinessclub, IDrivee2 S3-compatible endpoint).
 * Keys are server-generated: members/<uuid>.<ext>. Only `members/` keys are ever deleted
 * (legacy paths like portraits/exec-01.jpg are never touched).
 */
const crypto = require("crypto");
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const {
  S3_ENDPOINT, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET,
} = require("../config/env");

const EXT = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png" };

let client = null;
function getClient() {
  if (!S3_BUCKET || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY) {
    const err = new Error("S3 not configured (S3_BUCKET / S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY)");
    err.status = 500;
    throw err;
  }
  if (!client) {
    client = new S3Client({
      region: S3_REGION,
      ...(S3_ENDPOINT ? { endpoint: S3_ENDPOINT } : {}),
      forcePathStyle: true,
      credentials: { accessKeyId: S3_ACCESS_KEY_ID, secretAccessKey: S3_SECRET_ACCESS_KEY },
    });
  }
  return client;
}

/**
 * Uploads buffer under a fresh members/<uuid>.<ext> key.
 * @returns {Promise<string>} the object key (not a URL)
 */
async function putImage(buffer, mimeType) {
  const ext = EXT[mimeType];
  if (!ext) {
    const err = new Error(`Unsupported image type: ${mimeType}`);
    err.status = 400;
    throw err;
  }
  const key = `members/${crypto.randomUUID()}.${ext}`;
  await getClient().send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  }));
  return key;
}

/**
 * Fetches an image stream and its metadata from S3.
 * Returns null if the object does not exist.
 * @param {string} key
 * @returns {Promise<{stream: import("stream").Readable, contentType: string, contentLength: number, etag: string, lastModified: Date}|null>}
 */
async function getImageStream(key) {
  if (!key || typeof key !== "string") return null;
  try {
    const res = await getClient().send(new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    }));
    return {
      stream: res.Body,
      contentType: res.ContentType || "application/octet-stream",
      contentLength: res.ContentLength,
      etag: res.ETag,
      lastModified: res.LastModified,
    };
  } catch (e) {
    if (e.name === "NoSuchKey" || e.name === "NotFound" || e.$metadata?.httpStatusCode === 404) {
      return null;
    }
    throw e;
  }
}

/**
 * Best-effort delete of an image this module created.
 * Never throws; ignores keys outside members/ (legacy files).
 * @returns {Promise<boolean>} true when a delete request was sent
 */
async function removeImage(key) {
  if (!key || !String(key).startsWith("members/")) return false;
  try {
    await getClient().send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }));
    return true;
  } catch (e) {
    console.error("s3 delete failed:", key, e && e.message ? e.message : e);
    return false;
  }
}

module.exports = { putImage, getImageStream, removeImage, EXT };
