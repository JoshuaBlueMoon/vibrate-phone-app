const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send(`<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Hello</h1></body></html>`);
});

app.listen(3000);
