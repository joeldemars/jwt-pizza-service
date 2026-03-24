const config = require("./config").logging;

function requestLogger(req, res, next) {
  let send = res.send;
  res.send = (resBody) => {
    const data = {
      authorized: !!req.headers.authorization,
      path: req.originalUrl,
      method: req.method,
      statusCode: res.statusCode,
      reqBody: JSON.stringify(req.body),
      resBody: JSON.stringify(resBody),
    };
    log(data.status >= 500 ? "error" : "info", "httpRequest", data);
    res.send = send;
    return res.send(resBody);
  };
  next();
}

function query(sql, params) {
  log("info", "sqlQuery", { sql, params });
}

function factoryRequest(reqBody, resBody) {
  const data = {
    requestBody: JSON.stringify(reqBody),
    responseBody: JSON.stringify(resBody),
  };

  log("info", "factoryRequest", data);
}

function exception(exception) {
  console.log(JSON.stringify(exception, Object.getOwnPropertyNames(exception)));
  log(
    "error",
    "exception",
    JSON.stringify(exception, Object.getOwnPropertyNames(exception)),
  );
}

function log(level, type, data) {
  try {
    fetch(config.endpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.accountId}:${config.apiKey}`,
      },
      body: JSON.stringify({
        streams: [
          {
            stream: { source: config.source, level, type },
            values: [
              [(Math.floor(Date.now()) * 1000000).toString(), sanitize(data)],
            ],
          },
        ],
      }),
    });
  } catch (error) {
    console.log(`Failed to send log: ${error}`);
  }
}

function sanitize(data) {
  return JSON.stringify(data)
    .replace(/\\"password\\":\s*\\"[^"]*\\"/g, '\\"password\\": \\"*****\\"')
    .replace(/\\password\\=\s*\\"[^"]*\\"/g, '\\"password\\"= \\"*****\\"');
}

module.exports = { requestLogger, query, factoryRequest, exception };
