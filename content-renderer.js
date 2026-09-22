(function (root) {
  const escape = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const icon = (value) =>
    '<i class="' + escape(value) + '" aria-hidden="true"></i>';
  const spans = (values) =>
    values.map((value) => "<span>" + escape(value) + "</span>").join("");
  function render(document, data) {
    const q = (selector) => document.querySelector(selector);
    const put = (selector, value) => {
      const el = q(selector);
      if (el) el.textContent = value;
    };
    const html = (selector, value) => {
      const el = q(selector);
      if (el) el.innerHTML = value;
    };
    const attr = (selector, name, value) => {
      const el = q(selector);
      if (el) el.setAttribute(name, value);
    };
    document.title = data.site.title;
    attr('meta[name="description"]', "content", data.site.description);
    attr('meta[name="keywords"]', "content", data.site.keywords);
    attr('meta[property="og:title"]', "content", data.site.title);
    attr('meta[property="og:description"]', "content", data.site.description);
    attr('meta[property="og:url"]', "content", data.site.url);
    attr('link[rel="icon"]', "href", data.site.favicon);
    html(".logo", escape(data.site.logo).replace("/", "<span>/</span>"));
    attr(
      ".logo",
      "aria-label",
      data.hero.name + " " + data.hero.highlight + ", início",
    );
    data.navigation.forEach((item) =>
      put('#main-nav a[href="#' + item.id + '"]', item.label),
    );
    html(
      ".hero-content h1",
      escape(data.hero.name) +
        " <span>" +
        escape(data.hero.highlight) +
        "</span>",
    );
    put(".hero-role", data.hero.role);
    put(".typewriter-container .sr-only", data.hero.words.join(", "));
    put("#typewriter", data.hero.words[0]);
    html(
      ".hero-buttons .cta-button",
      icon("fas fa-code") + " " + escape(data.hero.primaryLabel),
    );
    attr(".hero-buttons .cta-button", "href", data.hero.primaryUrl);
    html(
      ".hero-buttons .cta-secondary",
      icon("far fa-comment") + " " + escape(data.hero.secondaryLabel),
    );
    attr(".hero-buttons .cta-secondary", "href", data.hero.secondaryUrl);
    put("#sobre h2", data.about.title);
    html(
      ".sobre-texto p",
      escape(data.about.body)
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/\n/g, "<br>"),
    );
    attr(".profile-pic", "src", data.about.image);
    attr(".profile-pic", "alt", data.about.imageAlt);
    html(
      ".sobre-botao-container",
      data.about.downloads
        .map(
          (item) =>
            '<a class="btn-primary" download href="' +
            escape(item.url) +
            '">' +
            icon("fas fa-download") +
            " " +
            escape(item.label) +
            "</a>",
        )
        .join(""),
    );
    put("#historico h2", data.history.title);
    html(
      '[data-tab="experiencias"]',
      icon("fas fa-briefcase") + " " + escape(data.history.experienceLabel),
    );
    html(
      '[data-tab="formacao"]',
      icon("fas fa-graduation-cap") + " " + escape(data.history.educationLabel),
    );
    html(
      "#experiencias-panel .timeline-container",
      data.experiences
        .map(
          (company) =>
            '<article class="timeline-item ' +
            (company.current ? "current-position" : "") +
            '"><div class="timeline-dot" aria-hidden="true"></div><div class="timeline-content"><header class="company-heading"><span class="company-mark" style="color:' +
            escape(company.color) +
            '" aria-hidden="true">' +
            icon(company.icon) +
            "</span><div><h3>" +
            escape(company.company) +
            '</h3><span class="company-area">' +
            escape(company.area) +
            "</span></div>" +
            (company.current
              ? '<span class="career-status"><span aria-hidden="true"></span> Atual</span>'
              : "") +
            "</header>" +
            company.roles
              .map(
                (role) =>
                  '<div class="role-entry ' +
                  (role.current ? "current-role" : "") +
                  '"><span class="timeline-date">' +
                  escape(role.period) +
                  "</span><h4>" +
                  escape(role.title) +
                  "</h4>" +
                  (role.tags.length
                    ? '<div class="career-tags">' + spans(role.tags) + "</div>"
                    : "") +
                  "</div>",
              )
              .join("") +
            "</div></article>",
        )
        .join(""),
    );
    html(
      "#formacao-panel .timeline-container",
      data.education
        .map(
          (item) =>
            '<article class="timeline-item ' +
            (item.current ? "current-position" : "") +
            '"><div class="timeline-dot" aria-hidden="true"></div><div class="timeline-content"><header class="company-heading"><span class="company-mark" aria-hidden="true">' +
            icon(item.icon) +
            '</span><div><span class="degree-type">' +
            escape(item.type) +
            "</span><h3>" +
            escape(item.title) +
            '</h3></div></header><div class="degree-info"><p>' +
            escape(item.institution) +
            '</p><span class="timeline-date">' +
            escape(item.period) +
            '</span><span class="degree-status ' +
            (item.current ? "" : "completed") +
            '">' +
            escape(item.status) +
            "</span></div></div></article>",
        )
        .join(""),
    );
    put("#habilidades h2", data.skillsTitle);
    html(
      ".skill-filters",
      '<button class="skill-filter active" data-filter="all" aria-pressed="true">Todas <span>' +
        data.skills.length +
        "</span></button>" +
        data.categories
          .map(
            (item) =>
              '<button class="skill-filter" data-filter="' +
              escape(item.id) +
              '" aria-pressed="false">' +
              icon(item.icon) +
              " " +
              escape(item.label) +
              "</button>",
          )
          .join(""),
    );
    html(
      ".skills-grid",
      data.skills
        .map(
          (item, i) =>
            '<button class="skill-card" data-skill="' +
            escape(item.id) +
            '" data-category="' +
            escape(item.categories.join(" ")) +
            '" style="--skill-color:' +
            escape(item.color) +
            '" aria-pressed="' +
            (i === 0) +
            '">' +
            icon(item.icon) +
            '<span class="skill-label">' +
            escape(item.name) +
            "<small>" +
            escape(
              item.categories
                .map(
                  (id) =>
                    data.categories.find((category) => category.id === id)
                      ?.label || "",
                )
                .join(" / "),
            ) +
            '</small></span><i class="fas fa-chevron-right skill-open" aria-hidden="true"></i></button>',
        )
        .join(""),
    );
    q("#skill-detail").hidden = !data.skills.length;
    put("#projetos h2", data.projectsTitle);
    html(
      ".project-swiper .swiper-wrapper",
      data.projects
        .map(
          (item) =>
            '<div class="swiper-slide"><div class="project-card"><img src="' +
            escape(item.image) +
            '" alt="' +
            escape(item.imageAlt) +
            '" loading="lazy"><div class="project-info"><h3>' +
            escape(item.title) +
            "</h3><p>" +
            escape(item.description) +
            '</p><div class="tech-tags">' +
            spans(item.tags) +
            '</div><div class="project-links">' +
            (item.liveUrl
              ? '<a class="btn-primary" href="' +
                escape(item.liveUrl) +
                '" target="_blank" rel="noopener noreferrer">Ver ao Vivo</a>'
              : "") +
            (item.codeUrl
              ? '<a class="btn-secondary" href="' +
                escape(item.codeUrl) +
                '" target="_blank" rel="noopener noreferrer">Código Fonte</a>'
              : "") +
            "</div></div></div></div>",
        )
        .join(""),
    );
    put("#contato h2", data.contact.title);
    put("#contato > .container > p", data.contact.body);
    html(
      ".contact-links",
      '<a href="mailto:' +
        escape(data.contact.email) +
        '" class="contact-button">' +
        icon("fas fa-envelope") +
        " " +
        escape(data.contact.emailLabel) +
        '</a><div class="copy-button-wrapper"><button id="copy-email-btn" class="contact-button">' +
        icon("fas fa-copy") +
        " " +
        escape(data.contact.copyLabel) +
        '</button><span id="copy-feedback" class="copy-feedback-tooltip" role="status"></span></div>' +
        data.contact.links
          .map(
            (item) =>
              '<a class="contact-button" href="' +
              escape(item.url) +
              '" target="_blank" rel="noopener noreferrer">' +
              icon(item.icon) +
              " " +
              escape(item.label) +
              "</a>",
          )
          .join(""),
    );
    html(
      "footer p",
      '&copy; <span id="footer-year">' +
        new Date().getFullYear() +
        "</span> " +
        escape(data.site.footer),
    );
    const colors = {
      primary: "--primary-color",
      secondary: "--secondary-color",
      background: "--background-color",
      card: "--card-background",
      text: "--text-color",
      heading: "--white",
      cyan: "--cyan",
      highlight: "--name-highlight",
    };
    Object.entries(colors).forEach(([key, css]) =>
      document.documentElement.style.setProperty(css, data.theme[key]),
    );
    document.body.classList.toggle("scene-disabled", !data.theme.scene);
  }
  if (typeof module !== "undefined" && module.exports)
    module.exports = { render };
  else root.PortfolioRenderer = { render };
})(typeof window !== "undefined" ? window : globalThis);
