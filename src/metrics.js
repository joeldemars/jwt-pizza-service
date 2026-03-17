const os = require("os");
const config = require("./config").metrics;

// Metrics stored in memory
let queue = [];
const activeUsers = new Map();

// Middleware to track requests
function requestTracker(req, res, next) {
  const method = req.method;
  const start = Date.now();
  res.on("finish", () => {
    const latency = Date.now() - start;
    createMetric("request", latency, "ms", "histogram", "asInt", { method });
  });
  next();
}

// This will periodically send metrics to Grafana
setInterval(() => {
  createMetric("cpu", getCpuUsage(), "%", "gauge", "asDouble", {});
  createMetric("memory", getMemoryUsage(), "%", "gauge", "asDouble", {});
  createMetric("users", getActiveUsers(), "1", "gauge", "asInt", {});

  sendMetricToGrafana(queue);
  queue = [];
}, 10000);

function createMetric(
  metricName,
  metricValue,
  metricUnit,
  metricType,
  valueType,
  attributes,
) {
  attributes = { ...attributes, source: config.source };

  const metric = {
    name: metricName,
    unit: metricUnit,
    [metricType]: {
      dataPoints: [
        {
          [valueType]: metricValue,
          timeUnixNano: Date.now() * 1000000,
          attributes: [],
        },
      ],
    },
  };

  Object.keys(attributes).forEach((key) => {
    metric[metricType].dataPoints[0].attributes.push({
      key: key,
      value: { stringValue: attributes[key] },
    });
  });

  if (metricType === "sum") {
    metric[metricType].aggregationTemporality =
      "AGGREGATION_TEMPORALITY_CUMULATIVE";
    metric[metricType].isMonotonic = true;
  }

  queue.push(metric);
}

function sendMetricToGrafana(metrics) {
  const body = { resourceMetrics: [{ scopeMetrics: [{ metrics }] }] };

  fetch(`${config.endpointUrl}`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      Authorization: `Bearer ${config.accountId}:${config.apiKey}`,
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP status: ${response.status}`);
      }
    })
    .catch((error) => {
      console.error("Error pushing metrics:", error);
    });
}

function getCpuUsage() {
  const cpuUsage = os.loadavg()[0] / os.cpus().length;
  return cpuUsage.toFixed(2) * 100;
}

function getMemoryUsage() {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsage = (usedMemory / totalMemory) * 100;
  return memoryUsage.toFixed(2);
}

function getActiveUsers() {
  let users = 0;
  const time = Date.now();
  for (let user in activeUsers) {
    if (activeUsers.get(user) - time > 5 * 60 * 1000) {
      activeUsers.delete(user);
    } else {
      users++;
    }
  }
  return users;
}

function recordPurchase(success, latency, price) {
  createMetric("purchase", 1, "1", "histogram", "asInt", {
    success,
    latency,
    price,
  });
}

function recordAuthAttempt(success) {
  createMetric("auth", 1, "1", "histogram", "asInt", {});
}

function recordUserActive(userId) {
  activeUsers.set(userId, Date.now());
}

module.exports = { requestTracker, recordPurchase, recordAuthAttempt, recordUserActive };
