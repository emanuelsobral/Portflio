const { parseHTML } = require("linkedom");
const { render } = require("../content-renderer.js");
function renderPage(template, data) {
  const { document } = parseHTML(template);
  render(document, data);
  const script = document.createElement("script");
  script.id = "portfolio-data";
  script.type = "application/json";
  script.textContent = JSON.stringify(data).replace(/</g, "\\u003c");
  document.head.append(script);
  return document.toString();
}
module.exports = { renderPage };
