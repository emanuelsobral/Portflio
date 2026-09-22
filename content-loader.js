window.portfolioReady = (async () => {
  if (location.protocol === "file:") return;
  let data;
  if (new URLSearchParams(location.search).has("preview")) {
    try {
      data = JSON.parse(sessionStorage.getItem("portfolio-preview"));
    } catch {}
  }
  if (!data && document.querySelector("#portfolio-data")) {
    try {
      data = JSON.parse(document.querySelector("#portfolio-data").textContent);
    } catch {}
  }
  if (!data) {
    try {
      const response = await fetch("/api/public-content", {
        signal: AbortSignal.timeout(5000),
        cache: "no-store",
      });
      if (response.ok) data = (await response.json()).data;
    } catch {}
  }
  if (!data) {
    try {
      const response = await fetch("content.json");
      if (response.ok) data = await response.json();
    } catch {}
  }
  if (data) {
    window.PORTFOLIO_CONTENT = data;
    window.PortfolioRenderer.render(document, data);
  }
})();
