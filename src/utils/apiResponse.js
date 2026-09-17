// Small helpers to keep every successful response in the same shape:
// { success: true, data: ..., meta?: ... }

function sendSuccess(res, data, statusCode = 200, meta = undefined) {
  const body = { success: true, data };
  if (meta !== undefined) body.meta = meta;
  return res.status(statusCode).json(body);
}

module.exports = { sendSuccess };
