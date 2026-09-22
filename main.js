document.addEventListener("DOMContentLoaded", async () => {
  await window.portfolioReady;
  const content = window.PORTFOLIO_CONTENT;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const typewriter = document.querySelector("#typewriter");
  const words = content?.hero.words || [
    "Estudante",
    "Front-End",
    "Back-End",
    "Dados",
  ];
  let wordIndex = 0;
  let character = words[0].length;
  let deleting = true;
  let typingTimer;
  let motionPaused = reducedMotion.matches || content?.theme.motion === false;
  function type() {
    if (motionPaused || document.hidden) return;
    character += deleting ? -1 : 1;
    typewriter.textContent = words[wordIndex].slice(0, character);
    let delay = deleting ? 65 : 110;
    if (character === 0) {
      deleting = false;
      wordIndex = (wordIndex + 1) % words.length;
      delay = 300;
    } else if (character === words[wordIndex].length) {
      deleting = true;
      delay = 1600;
    }
    typingTimer = setTimeout(type, delay);
  }
  function syncTyping() {
    clearTimeout(typingTimer);
    if (!motionPaused && !document.hidden) typingTimer = setTimeout(type, 1400);
  }
  document.addEventListener("visibilitychange", syncTyping);
  const header = document.querySelector("#main-header");
  const progress = document.querySelector(".scroll-progress");
  const menu = document.querySelector("#main-nav");
  const toggle = document.querySelector("#mobile-menu-toggle");
  const links = [...menu.querySelectorAll("a")];
  const sections = [...document.querySelectorAll("section[id]")];
  function closeMenu() {
    setMenu(false);
  }
  function setMenu(open) {
    menu.classList.toggle("active", open);
    document.body.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute(
      "aria-label",
      open ? "Fechar menu de navegação" : "Abrir menu de navegação",
    );
    toggle.querySelector("i").className = open ? "fas fa-xmark" : "fas fa-bars";
  }
  toggle.addEventListener("click", () =>
    setMenu(!menu.classList.contains("active")),
  );
  links.forEach((link) => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu.classList.contains("active")) {
      closeMenu();
      toggle.focus();
    }
    if (event.key === "Tab" && menu.classList.contains("active")) {
      if (event.shiftKey && document.activeElement === links[0]) {
        event.preventDefault();
        toggle.focus();
      } else if (!event.shiftKey && document.activeElement === toggle) {
        event.preventDefault();
        links[0].focus();
      }
    }
  });
  matchMedia("(min-width: 761px)").addEventListener("change", closeMenu);
  let pendingScroll = false;
  function updateScroll() {
    header.classList.toggle("scrolled", scrollY > 50);
    const extent = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${extent > 0 ? scrollY / extent : 0})`;
    const current =
      sections
        .filter((section) => section.getBoundingClientRect().top <= 160)
        .at(-1) || sections[0];
    links.forEach((link) => {
      const active = link.hash === "#" + current.id;
      link.classList.toggle("active-link", active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
    pendingScroll = false;
  }
  addEventListener(
    "scroll",
    () => {
      if (!pendingScroll) {
        pendingScroll = true;
        requestAnimationFrame(updateScroll);
      }
    },
    { passive: true },
  );
  updateScroll();
  document.body.classList.add("motion-ready");
  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      }),
    { threshold: 0, rootMargin: "0px 0px -35px 0px" },
  );
  document
    .querySelectorAll(".scroll-reveal")
    .forEach((element) => observer.observe(element));

  const tabs = [...document.querySelectorAll(".tab-btn")];
  document.querySelector(".tabs-nav").setAttribute("role", "tablist");
  document
    .querySelector(".tabs-nav")
    .setAttribute("aria-label", "Histórico profissional");
  function selectTab(tab) {
    tabs.forEach((button) => {
      const active = button === tab;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", String(active));
      button.tabIndex = active ? 0 : -1;
      document
        .getElementById(button.dataset.tab + "-panel")
        .classList.toggle("active", active);
    });
  }
  tabs.forEach((tab, index) => {
    tab.id = tab.dataset.tab + "-tab";
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", tab.dataset.tab + "-panel");
    const panel = document.getElementById(tab.dataset.tab + "-panel");
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", tab.id);
    tab.addEventListener("click", () => selectTab(tab));
    tab.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
        return;
      event.preventDefault();
      const next =
        event.key === "Home"
          ? tabs[0]
          : event.key === "End"
            ? tabs.at(-1)
            : tabs[
                (index + (event.key === "ArrowRight" ? 1 : tabs.length - 1)) %
                  tabs.length
              ];
      selectTab(next);
      next.focus();
    });
  });
  selectTab(tabs.find((tab) => tab.classList.contains("active")));

  const descriptions = content
    ? Object.fromEntries(
        content.skills.map((skill) => [skill.id, skill.description]),
      )
    : {
        html5: "HTML5: estrutura semântica e acessível para a web.",
        css3: "CSS3: interfaces responsivas, composição visual e animações.",
        javascript: "JavaScript: interatividade, lógica e experiências na web.",
        nodejs: "Node.js: aplicações no servidor e desenvolvimento de APIs.",
        python:
          "Python: análise de dados, automação e desenvolvimento back-end.",
        mysql:
          "MySQL: armazenamento, modelagem e consultas de dados relacionais.",
        git: "Git: controle de versão e colaboração em projetos de software.",
        java: "Java: programação orientada a objetos e aplicações corporativas.",
        athena:
          "Athena: consultas SQL para análise de dados armazenados no Amazon S3.",
      };
  const description = document.querySelector("#skill-description");
  const detail = document.querySelector("#skill-detail");
  const skills = [...document.querySelectorAll(".skill-card")];
  const filters = [...document.querySelectorAll(".skill-filter")];
  const skillsGrid = document.querySelector(".skills-grid");
  const mobileSkills = window.matchMedia("(max-width: 760px)");
  function positionSkillDetail() {
    const visible = skills.filter((card) => !card.hidden);
    const index = visible.findIndex(
      (card) => card.getAttribute("aria-pressed") === "true",
    );
    if (mobileSkills.matches && index !== -1) {
      // Keep the full-width description immediately after the selected grid row.
      const rowEnd = Math.min(index - (index % 2) + 1, visible.length - 1);
      visible[rowEnd].after(detail);
    } else {
      skillsGrid.after(detail);
    }
  }
  mobileSkills.addEventListener("change", positionSkillDetail);
  const skillTags = content
    ? Object.fromEntries(content.skills.map((skill) => [skill.id, skill.tags]))
    : {
        html5: ["Semântica", "Acessibilidade", "Estrutura"],
        css3: ["Responsividade", "Layouts", "Animações"],
        javascript: ["DOM", "Interatividade", "Lógica"],
        nodejs: ["APIs", "Servidor", "JavaScript"],
        python: ["Automação", "Análise de dados", "Back-End"],
        mysql: ["SQL", "Modelagem", "Consultas"],
        git: ["Versionamento", "Branches", "Colaboração"],
        java: ["Orientação a objetos", "Aplicações", "Back-End"],
        athena: ["AWS", "SQL", "Amazon S3"],
      };
  function selectSkill(card, animate = true) {
    detail.hidden = !card;
    if (!card) return;
    skills.forEach((skill) => {
      const selected = skill === card;
      skill.setAttribute("aria-pressed", String(selected));
      skill.querySelector(".skill-open").className = selected
        ? "fas fa-check skill-open"
        : "fas fa-chevron-right skill-open";
    });
    const name = card.querySelector(".skill-label").childNodes[0].textContent;
    document.querySelector("#skill-detail-name").textContent = name;
    document.querySelector(".skill-detail-category").textContent =
      card.querySelector("small").textContent;
    document.querySelector("#skill-detail-icon").className =
      card.querySelector("i").className;
    description.textContent = descriptions[card.dataset.skill];
    detail.style.setProperty(
      "--detail-color",
      getComputedStyle(card).getPropertyValue("--skill-color"),
    );
    const tags = skillTags[card.dataset.skill].map((text) => {
      const tag = document.createElement("span");
      tag.textContent = text;
      return tag;
    });
    document.querySelector("#skill-detail-tags").replaceChildren(...tags);
    positionSkillDetail();
    if (animate && !motionPaused) {
      detail.getAnimations().forEach((animation) => animation.cancel());
      detail.animate(
        [
          { opacity: 0.4, transform: "translateY(6px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 260, easing: "ease-out" },
      );
    }
  }
  skills.forEach((card) => {
    card.setAttribute("aria-controls", detail.id);
    card.addEventListener("click", () => {
      selectSkill(card);
      if (mobileSkills.matches) {
        detail.scrollIntoView({
          block: "nearest",
          behavior: motionPaused ? "instant" : "smooth",
        });
      }
    });
  });
  filters.forEach((filter) => {
    filter.addEventListener("click", () => {
      filters.forEach((button) => {
        const active = filter === button;
        button.setAttribute("aria-pressed", String(active));
        button.classList.toggle("active", active);
      });
      skills.forEach((card) => {
        card.hidden =
          filter.dataset.filter !== "all" &&
          !card.dataset.category.split(" ").includes(filter.dataset.filter);
      });
      const selected = skills.find(
        (card) => card.getAttribute("aria-pressed") === "true",
      );
      if (!selected || selected.hidden)
        selectSkill(skills.find((card) => !card.hidden));
      positionSkillDetail();
    });
  });
  selectSkill(
    skills.find((card) => card.getAttribute("aria-pressed") === "true"),
    false,
  );
  document
    .querySelectorAll('a[target="_blank"]')
    .forEach((link) => (link.rel = "noopener noreferrer"));
  const feedback = document.querySelector("#copy-feedback");
  let feedbackTimer;
  document
    .querySelector("#copy-email-btn")
    .addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(
          content?.contact.email || "emanuelssobral@gmail.com",
        );
        feedback.textContent = "E-mail copiado!";
      } catch {
        feedback.textContent =
          "E-mail: " + (content?.contact.email || "emanuelssobral@gmail.com");
      }
      feedback.classList.add("visible");
      clearTimeout(feedbackTimer);
      feedbackTimer = setTimeout(
        () => feedback.classList.remove("visible"),
        4000,
      );
    });
  document.querySelector("#footer-year").textContent = new Date().getFullYear();
  let projectSwiper;
  if (window.Swiper && document.querySelector(".swiper-slide")) {
    const controls = document.createElement("div");
    controls.className = "project-controls";
    controls.innerHTML =
      '<button class="project-prev" aria-label="Projeto anterior" title="Projeto anterior"><i class="fas fa-arrow-left" aria-hidden="true"></i></button><span class="project-pagination"></span><button class="project-next" aria-label="Próximo projeto" title="Próximo projeto"><i class="fas fa-arrow-right" aria-hidden="true"></i></button>';
    document.querySelector(".project-swiper").after(controls);
    projectSwiper = new Swiper(".project-swiper", {
      slidesPerView: 1,
      spaceBetween: 24,
      speed: reducedMotion.matches ? 0 : 550,
      grabCursor: true,
      navigation: { nextEl: ".project-next", prevEl: ".project-prev" },
      pagination: { el: ".project-pagination", type: "fraction" },
      a11y: {
        prevSlideMessage: "Projeto anterior",
        nextSlideMessage: "Próximo projeto",
        slideLabelMessage: "Projeto {{index}} de {{slidesLength}}",
      },
      breakpoints: { 761: { slidesPerView: 2 }, 1150: { slidesPerView: 3 } },
    });
  }
  const motionButton = document.querySelector("#motion-toggle");
  let userPaused = false;
  function updateMotion() {
    const paused =
      userPaused || reducedMotion.matches || content?.theme.motion === false;
    motionPaused = paused;
    syncTyping();
    if (projectSwiper) projectSwiper.params.speed = paused ? 0 : 550;
    document.body.classList.toggle("motion-paused", paused);
    motionButton.setAttribute("aria-pressed", String(paused));
    motionButton.setAttribute(
      "aria-label",
      paused ? "Retomar animações" : "Pausar animações",
    );
    motionButton.title = reducedMotion.matches
      ? "Movimento reduzido nas preferências do sistema"
      : motionButton.getAttribute("aria-label");
    motionButton.disabled =
      reducedMotion.matches || content?.theme.motion === false;
    motionButton.querySelector("i").className = paused
      ? "fas fa-play"
      : "fas fa-pause";
    window.dispatchEvent(
      new CustomEvent("portfolio-motion", { detail: { paused } }),
    );
  }
  motionButton.addEventListener("click", () => {
    userPaused = !userPaused;
    updateMotion();
  });
  reducedMotion.addEventListener("change", updateMotion);
  updateMotion();
});
