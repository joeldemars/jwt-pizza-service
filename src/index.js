const app = require("./service.js");
const logger = require("./logger.js");

const port = process.argv[2] || 3000;
process.on("uncaughtException", (err) => logger.exception(err));
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
