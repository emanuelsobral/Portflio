(() => {
  const $ = (selector) => document.querySelector(selector);
  const assetSrc = (value) => {
    try {
      return new URL(value, location.origin + "/").href;
    } catch {
      return "";
    }
  };
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
  const icons = [
    "fas fa-code",
    "fas fa-laptop-code",
    "fas fa-desktop",
    "fas fa-server",
    "fas fa-database",
    "fas fa-building",
    "fas fa-signal",
    "fas fa-book-open",
    "fas fa-graduation-cap",
    "fas fa-briefcase",
    "fas fa-chart-pie",
    "fas fa-chart-line",
    "fas fa-cloud",
    "fas fa-gear",
    "fas fa-envelope",
    "fas fa-link",
    "fas fa-code-branch",
    "far fa-folder-open",
    "fab fa-html5",
    "fab fa-css3-alt",
    "fab fa-js-square",
    "fab fa-node-js",
    "fab fa-python",
    "fab fa-git-alt",
    "fab fa-java",
    "fab fa-github",
    "fab fa-linkedin",
    "fab fa-react",
    "fab fa-docker",
    "fab fa-aws",
    "fab fa-instagram",
    "fab fa-whatsapp",
  ];
  const pages = [
    ["general", "Geral", "fas fa-sliders"],
    ["hero", "Início", "fas fa-house"],
    ["about", "Sobre", "far fa-user"],
    ["experiences", "Experiências", "fas fa-briefcase"],
    ["education", "Formação", "fas fa-graduation-cap"],
    ["skills", "Habilidades", "fas fa-code"],
    ["projects", "Projetos", "far fa-folder-open"],
    ["contact", "Contato", "far fa-envelope"],
    ["theme", "Aparência", "fas fa-palette"],
    ["backup", "Backup e conta", "fas fa-shield-halved"],
  ];
  let data,
    baseline,
    etag,
    csrf,
    session,
    dirty = false,
    page = "general",
    saving = false;
  let toastTimer;
  const get = (path) => path.split(".").reduce((obj, key) => obj?.[key], data);
  const set = (path, value) => {
    const keys = path.split(".");
    const key = keys.pop();
    keys.reduce((obj, key) => obj[key], data)[key] = value;
  };
  function notify(message) {
    $("#toast").textContent = message;
    $("#toast").hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => ($("#toast").hidden = true), 4000);
  }
  function showError(message, auth = false) {
    const box = $(auth ? "#auth-message" : "#app-message");
    box.textContent = message;
    box.hidden = false;
  }
  function changed() {
    dirty = JSON.stringify(data) !== baseline;
    $("#save-state").textContent = dirty
      ? "Alterações não salvas"
      : "Tudo salvo";
    $("#save-state").classList.toggle("dirty", dirty);
    $("#save").disabled = !dirty || saving;
  }
  function lockEditor(busy) {
    saving = busy;
    $("#editor-form").inert = busy;
    $("#editor-nav").inert = busy;
    $("#backup-view").inert = busy;
    $("#preview").disabled = busy;
    $("#logout").disabled = busy;
    changed();
  }
  async function api(path, options = {}) {
    const headers = {
      ...(options.body && typeof options.body === "string"
        ? { "Content-Type": "application/json" }
        : {}),
      ...(csrf ? { "X-CSRF-Token": csrf } : {}),
      ...options.headers,
    };
    const response = await fetch("/api/" + path, {
      ...options,
      headers,
      cache: "no-store",
    });
    let result;
    try {
      result = await response.json();
    } catch {
      throw new Error("O servidor do painel não está disponível.");
    }
    if (!response.ok) {
      if (response.status === 401 && !["login", "setup"].includes(path)) {
        $("#app").hidden = true;
        $("#auth").hidden = false;
        $("#auth-title").textContent = "Entre novamente";
      }
      throw Object.assign(
        new Error(result.error || "Não foi possível concluir."),
        { issues: result.issues, status: response.status },
      );
    }
    return result;
  }
  function ask(title, message) {
    $("#confirm-title").textContent = title;
    $("#confirm-message").textContent = message;
    const dialog = $("#confirm-dialog");
    dialog.returnValue = "";
    dialog.showModal();
    return new Promise((resolve) => {
      dialog.onclose = () => resolve(dialog.returnValue === "yes");
    });
  }
  $("#confirm-no").onclick = () => $("#confirm-dialog").close("no");
  $("#confirm-yes").onclick = () => $("#confirm-dialog").close("yes");
  function field(path, label, type = "text", extra = {}) {
    const value = get(path) ?? "";
    const id = "field-" + path.replaceAll(".", "-");
    const common = ' id="' + id + '" data-path="' + escape(path) + '"';
    let control;
    if (type === "textarea" || type === "list") {
      control =
        "<textarea" +
        common +
        ' data-kind="' +
        type +
        '" rows="' +
        (extra.rows || 3) +
        '">' +
        escape(Array.isArray(value) ? value.join("\n") : value) +
        "</textarea>";
    } else if (type === "checkbox") {
      control =
        '<input type="checkbox"' + common + (value ? " checked" : "") + ">";
    } else if (type === "icon") {
      const choices = [...new Set([value, ...icons])];
      control =
        "<select" +
        common +
        ">" +
        choices
          .map(
            (item) =>
              '<option value="' +
              escape(item) +
              '"' +
              (item === value ? " selected" : "") +
              ">" +
              escape(item.replace(/^(fas|far|fab) fa-/, "")) +
              "</option>",
          )
          .join("") +
        "</select>";
    } else if (type === "categories") {
      control =
        '<div class="category-checkboxes">' +
        data.categories
          .map(
            (category) =>
              '<label><input type="checkbox" data-categories="' +
              escape(path) +
              '" value="' +
              escape(category.id) +
              '"' +
              (value.includes(category.id) ? " checked" : "") +
              ">" +
              escape(category.label) +
              "</label>",
          )
          .join("") +
        "</div>";
    } else if (type === "asset" || type === "document") {
      control =
        '<div class="input-actions"><input type="text"' +
        common +
        ' value="' +
        escape(value) +
        '"><label class="icon-btn secondary" title="Enviar arquivo" aria-label="Enviar arquivo">' +
        '<i class="fas fa-upload" aria-hidden="true"></i><input type="file" data-upload="' +
        escape(path) +
        '" data-kind="' +
        type +
        '" accept="' +
        (type === "asset"
          ? "image/png,image/jpeg,image/webp,image/gif"
          : ".pdf,.docx") +
        '" hidden></label></div>';
      if (value && type === "asset")
        control +=
          '<img class="asset-preview" src="' +
          escape(assetSrc(value)) +
          '" alt="Imagem atual" loading="lazy">';
    } else if (type === "range") {
      control =
        '<input type="range"' +
        common +
        ' min="0.2" max="2" step="0.1" value="' +
        value +
        '"><output id="' +
        id +
        '-output">' +
        value +
        "x</output>";
    } else
      control =
        '<input type="' +
        type +
        '"' +
        common +
        ' value="' +
        escape(value) +
        '">';
    return (
      '<label class="field ' +
      (extra.wide ? "wide " : "") +
      (type === "checkbox" ? "checkbox" : "") +
      '" data-field="' +
      escape(path) +
      '">' +
      (type === "checkbox"
        ? control + " " + escape(label)
        : "<span>" + escape(label) + "</span>" + control) +
      (extra.help
        ? '<span class="field-help">' + escape(extra.help) + "</span>"
        : "") +
      "</label>"
    );
  }
  const fields = (content) => '<div class="fields">' + content + "</div>";
  const section = (title, content) =>
    '<section class="editor-section"><h2>' +
    escape(title) +
    "</h2>" +
    content +
    "</section>";
  const F = field;
  function controls(path, index, length) {
    return (
      '<div class="entry-actions">' +
      '<button type="button" class="icon-btn" data-move="' +
      path +
      "." +
      index +
      '" data-step="-1" title="Mover para cima" aria-label="Mover para cima"' +
      (index === 0 ? " disabled" : "") +
      '><i class="fas fa-arrow-up" aria-hidden="true"></i></button>' +
      '<button type="button" class="icon-btn" data-move="' +
      path +
      "." +
      index +
      '" data-step="1" title="Mover para baixo" aria-label="Mover para baixo"' +
      (index === length - 1 ? " disabled" : "") +
      '><i class="fas fa-arrow-down" aria-hidden="true"></i></button>' +
      '<button type="button" class="icon-btn" data-remove="' +
      path +
      "." +
      index +
      '" title="Remover item" aria-label="Remover item"><i class="far fa-trash-can" aria-hidden="true"></i></button></div>'
    );
  }
  function collection(path, title, renderItem, titleForItem) {
    const list = get(path);
    return (
      '<section class="editor-section"><div class="collection-heading"><h2>' +
      escape(title) +
      ' <span class="count">' +
      list.length +
      '</span></h2><button type="button" class="secondary" data-add="' +
      path +
      '"><i class="fas fa-plus" aria-hidden="true"></i> Adicionar</button></div>' +
      (list.length
        ? list
            .map(
              (item, index) =>
                '<details class="entry" data-entry="' +
                path +
                "." +
                index +
                '"' +
                (index === 0 ? " open" : "") +
                '><summary><span class="entry-index">' +
                String(index + 1).padStart(2, "0") +
                '</span><span class="entry-title">' +
                escape(titleForItem(item)) +
                "</span>" +
                controls(path, index, list.length) +
                '</summary><div class="entry-body">' +
                renderItem(path + "." + index, item) +
                "</div></details>",
            )
            .join("")
        : '<p class="empty">Nenhum item cadastrado.</p>') +
      "</section>"
    );
  }
  function renderRoles(path, item) {
    return (
      '<div class="roles-heading"><h3>Cargos</h3><button class="secondary" type="button" data-add="' +
      path +
      '.roles"><i class="fas fa-plus" aria-hidden="true"></i> Cargo</button></div>' +
      item.roles
        .map(
          (role, i) =>
            '<div class="role-editor"><div class="collection-heading"><h3>' +
            escape(role.title || "Novo cargo") +
            "</h3>" +
            controls(path + ".roles", i, item.roles.length) +
            "</div>" +
            fields(
              F(path + ".roles." + i + ".title", "Cargo") +
                F(path + ".roles." + i + ".period", "Período") +
                F(
                  path + ".roles." + i + ".current",
                  "Cargo atual",
                  "checkbox",
                ) +
                F(
                  path + ".roles." + i + ".tags",
                  "Tecnologias e áreas",
                  "list",
                  { help: "Um item por linha." },
                ),
            ) +
            "</div>",
        )
        .join("")
    );
  }
  function render() {
    $("#page-title").textContent = pages.find((item) => item[0] === page)[1];
    $("#editor-nav")
      .querySelectorAll("button")
      .forEach((button) => {
        button.classList.toggle("active", button.dataset.page === page);
        button.setAttribute(
          "aria-current",
          button.dataset.page === page ? "page" : "false",
        );
      });
    $("#editor-form").hidden = page === "backup";
    $("#backup-view").hidden = page !== "backup";
    $("#app-message").hidden = true;
    let html = "";
    if (page === "general")
      html =
        section(
          "Identidade",
          fields(
            F("site.logo", "Marca no menu") +
              F("site.title", "Título da página") +
              F("site.favicon", "Ícone do site", "asset") +
              F("site.url", "Endereço do site", "url") +
              F("site.description", "Descrição para busca", "textarea", {
                wide: true,
              }) +
              F("site.keywords", "Palavras-chave") +
              F("site.footer", "Rodapé"),
          ),
        ) +
        section(
          "Menu",
          fields(
            data.navigation
              .map((item, i) => F("navigation." + i + ".label", item.label))
              .join(""),
          ),
        );
    if (page === "hero")
      html =
        section(
          "Apresentação",
          fields(
            F("hero.name", "Nome") +
              F("hero.highlight", "Nome em destaque") +
              F("hero.role", "Título profissional", "text", { wide: true }) +
              F("hero.words", "Palavras da animação", "list", {
                wide: true,
                help: "Uma palavra ou expressão por linha.",
              }),
          ),
        ) +
        section(
          "Botões",
          fields(
            F("hero.primaryLabel", "Botão principal") +
              F("hero.primaryUrl", "Destino do botão principal") +
              F("hero.secondaryLabel", "Botão secundário") +
              F("hero.secondaryUrl", "Destino do botão secundário"),
          ),
        );
    if (page === "about")
      html =
        section(
          "Sobre você",
          fields(
            F("about.title", "Título da seção") +
              F("about.image", "Foto ou avatar", "asset") +
              F("about.imageAlt", "Descrição da imagem") +
              F("about.body", "Biografia", "textarea", {
                wide: true,
                rows: 9,
                help: "Use **texto** para destacar palavras em negrito.",
              }),
          ),
        ) +
        collection(
          "about.downloads",
          "Currículos",
          (p) =>
            fields(
              F(p + ".label", "Nome do botão") +
                F(p + ".url", "Arquivo", "document"),
            ),
          (item) => item.label,
        );
    if (page === "experiences")
      html =
        section(
          "Histórico",
          fields(
            F("history.title", "Título da seção") +
              F("history.experienceLabel", "Nome da aba"),
          ),
        ) +
        collection(
          "experiences",
          "Empresas",
          (p, item) =>
            fields(
              F(p + ".company", "Empresa") +
                F(p + ".area", "Área") +
                F(p + ".icon", "Ícone", "icon") +
                F(p + ".color", "Cor", "color") +
                F(p + ".current", "Empresa atual", "checkbox"),
            ) + renderRoles(p, item),
          (item) => item.company,
        );
    if (page === "education")
      html =
        section(
          "Formação",
          fields(F("history.educationLabel", "Nome da aba")),
        ) +
        collection(
          "education",
          "Cursos",
          (p) =>
            fields(
              F(p + ".title", "Curso") +
                F(p + ".type", "Tipo de formação") +
                F(p + ".institution", "Instituição", "text", { wide: true }) +
                F(p + ".period", "Período") +
                F(p + ".status", "Situação") +
                F(p + ".icon", "Ícone", "icon") +
                F(p + ".current", "Em andamento", "checkbox"),
            ),
          (item) => item.title,
        );
    if (page === "skills")
      html =
        section("Habilidades", fields(F("skillsTitle", "Título da seção"))) +
        collection(
          "skills",
          "Tecnologias",
          (p) =>
            fields(
              F(p + ".name", "Nome") +
                F(p + ".icon", "Ícone", "icon") +
                F(p + ".color", "Cor", "color") +
                F(p + ".categories", "Áreas", "categories") +
                F(p + ".description", "Descrição", "textarea", { wide: true }) +
                F(p + ".tags", "Detalhes", "list", {
                  wide: true,
                  help: "Um item por linha.",
                }),
            ),
          (item) => item.name,
        ) +
        collection(
          "categories",
          "Áreas",
          (p) =>
            fields(F(p + ".label", "Nome") + F(p + ".icon", "Ícone", "icon")),
          (item) => item.label,
        );
    if (page === "projects")
      html =
        section("Projetos", fields(F("projectsTitle", "Título da seção"))) +
        collection(
          "projects",
          "Projetos",
          (p) =>
            fields(
              F(p + ".title", "Nome") +
                F(p + ".image", "Imagem", "asset") +
                F(p + ".imageAlt", "Descrição da imagem") +
                F(p + ".description", "Descrição", "textarea", { wide: true }) +
                F(p + ".tags", "Tecnologias", "list") +
                F(p + ".liveUrl", "Link do projeto", "url") +
                F(p + ".codeUrl", "Link do código", "url"),
            ),
          (item) => item.title,
        );
    if (page === "contact")
      html =
        section(
          "Contato",
          fields(
            F("contact.title", "Título") +
              F("contact.email", "E-mail", "email") +
              F("contact.body", "Mensagem", "textarea", { wide: true }) +
              F("contact.emailLabel", "Botão de e-mail") +
              F("contact.copyLabel", "Botão de copiar e-mail"),
          ),
        ) +
        collection(
          "contact.links",
          "Redes e links",
          (p) =>
            fields(
              F(p + ".label", "Nome") +
                F(p + ".url", "Endereço", "url") +
                F(p + ".icon", "Ícone", "icon"),
            ),
          (item) => item.label,
        );
    if (page === "theme")
      html =
        section(
          "Cores",
          fields(
            [
              ["primary", "Destaque"],
              ["secondary", "Secundária"],
              ["background", "Fundo"],
              ["card", "Cards"],
              ["text", "Texto"],
              ["heading", "Títulos"],
              ["cyan", "Acento"],
              ["highlight", "Nome em destaque"],
            ]
              .map(([key, label]) => F("theme." + key, label, "color"))
              .join(""),
          ),
        ) +
        section(
          "Movimento",
          fields(
            F("theme.scene", "Exibir cena 3D", "checkbox") +
              F("theme.motion", "Ativar animações", "checkbox") +
              F("theme.speed", "Velocidade do 3D", "range", { wide: true }),
          ),
        );
    $("#editor-form").innerHTML = html;
    if (page === "backup") loadBackups();
  }
  function newItem(path) {
    const id = "item-" + crypto.randomUUID();
    if (path.endsWith(".roles"))
      return {
        title: "Novo cargo",
        period: "Período",
        current: false,
        tags: [],
      };
    return {
      experiences: {
        id,
        company: "Nova empresa",
        area: "",
        icon: "fas fa-building",
        color: "#aa68ed",
        current: false,
        roles: [
          { title: "Novo cargo", period: "Período", current: false, tags: [] },
        ],
      },
      education: {
        id,
        title: "Novo curso",
        type: "Formação",
        institution: "Instituição",
        period: "Período",
        status: "Cursando",
        current: true,
        icon: "fas fa-graduation-cap",
      },
      skills: {
        id,
        name: "Nova habilidade",
        categories: [data.categories[0].id],
        icon: "fas fa-code",
        color: "#aa68ed",
        description: "",
        tags: [],
      },
      categories: { id, label: "Nova área", icon: "fas fa-code" },
      projects: {
        id,
        title: "Novo projeto",
        description: "",
        image: "./img/cronoanalise.png",
        imageAlt: "",
        tags: [],
        liveUrl: "",
        codeUrl: "",
      },
      "about.downloads": { label: "Currículo", url: "./src/Curriculo.pdf" },
      "contact.links": {
        label: "Novo link",
        url: "https://example.com",
        icon: "fas fa-link",
      },
    }[path];
  }
  function openEntry(path) {
    const entry = $('[data-entry="' + path + '"]');
    if (entry) {
      entry.open = true;
      entry.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }
  $("#editor-form").addEventListener("input", (event) => {
    const target = event.target;
    if (target.dataset.path) {
      let value =
        target.type === "checkbox"
          ? target.checked
          : target.type === "range"
            ? Number(target.value)
            : target.value;
      if (target.dataset.kind === "list")
        value = value
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
      set(target.dataset.path, value);
      if (target.type === "range")
        $("#" + target.id + "-output").textContent = value + "x";
      target.closest(".field")?.classList.remove("invalid");
      changed();
    } else if (target.dataset.categories) {
      set(
        target.dataset.categories,
        [
          ...document.querySelectorAll(
            '[data-categories="' + target.dataset.categories + '"]:checked',
          ),
        ].map((input) => input.value),
      );
      changed();
    }
  });
  $("#editor-form").addEventListener("submit", (event) =>
    event.preventDefault(),
  );
  $("#editor-form").addEventListener("click", async (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.add) {
      const path = button.dataset.add;
      get(path).push(newItem(path));
      changed();
      render();
      openEntry(path + "." + (get(path).length - 1));
    } else if (button.dataset.remove) {
      event.preventDefault();
      const parts = button.dataset.remove.split("."),
        index = Number(parts.pop()),
        path = parts.join(".");
      if (
        path === "categories" &&
        (get(path).length === 1 ||
          data.skills.some((skill) =>
            skill.categories.includes(get(path)[index].id),
          ))
      ) {
        showError(
          "Esta área está em uso. Atualize as habilidades antes de removê-la.",
        );
        return;
      }
      if (path.endsWith(".roles") && get(path).length === 1) {
        showError("Cada empresa precisa de pelo menos um cargo.");
        return;
      }
      if (
        await ask(
          "Remover item?",
          "A remoção será publicada quando você salvar.",
        )
      ) {
        get(path).splice(index, 1);
        changed();
        render();
      }
    } else if (button.dataset.move) {
      event.preventDefault();
      const parts = button.dataset.move.split("."),
        i = Number(parts.pop()),
        path = parts.join("."),
        j = i + Number(button.dataset.step),
        list = get(path);
      if (j >= 0 && j < list.length) {
        [list[i], list[j]] = [list[j], list[i]];
        changed();
        render();
        openEntry(path + "." + j);
      }
    }
  });
  $("#editor-form").addEventListener("change", async (event) => {
    const input = event.target;
    if (!input.dataset.upload || !input.files[0]) return;
    const file = input.files[0],
      path = input.dataset.upload;
    if (file.size > 3 * 1024 * 1024) {
      showError("O limite por arquivo é 3 MB.");
      input.value = "";
      return;
    }
    input.disabled = true;
    lockEditor(true);
    try {
      const result = await api("upload", {
        method: "POST",
        body: file,
        headers: {
          "Content-Type": file.type || "application/octet-stream",
          "X-File-Name": encodeURIComponent(file.name),
          "X-Upload-Kind": input.dataset.kind,
        },
      });
      set(path, result.url);
      changed();
      const parent = input.closest("[data-entry]")?.dataset.entry;
      render();
      if (parent) openEntry(parent);
      notify("Arquivo enviado. Salve para publicar.");
    } catch (error) {
      showError(error.message);
    } finally {
      input.disabled = false;
      lockEditor(false);
    }
  });
  async function loadBackups() {
    try {
      const result = await api("backups");
      $("#backup-list").innerHTML = result.backups.length
        ? result.backups
            .map(
              (item) =>
                '<div class="backup-row"><span>' +
                escape(
                  item.date
                    .replace("T", " ")
                    .replace(/-(\d\d)-(\d\d)$/, " $1:$2"),
                ) +
                '</span><button type="button" class="secondary" data-restore="' +
                escape(item.id) +
                '"><i class="fas fa-rotate-left" aria-hidden="true"></i> Restaurar</button></div>',
            )
            .join("")
        : '<p class="empty">As versões aparecem após o primeiro salvamento.</p>';
    } catch (error) {
      showError(error.message);
    }
  }
  function fieldErrors(error) {
    if (error.issues?.length) {
      const first = error.issues[0].path.split(".")[0];
      const destination =
        {
          site: "general",
          navigation: "general",
          history: "experiences",
          categories: "skills",
          skillsTitle: "skills",
          projectsTitle: "projects",
        }[first] || first;
      if (pages.some((item) => item[0] === destination)) {
        page = destination;
        render();
      }
      error.issues.forEach((issue) => {
        const label = $('[data-field="' + issue.path + '"]');
        if (label) {
          label.classList.add("invalid");
          const message = document.createElement("span");
          message.className = "field-error";
          message.textContent = issue.message;
          label.append(message);
          const details = label.closest("details");
          if (details) details.open = true;
        }
      });
      $(
        ".field.invalid input, .field.invalid textarea, .field.invalid select",
      )?.focus();
      showError(
        error.message +
          " " +
          error.issues
            .map((issue) => issue.path + ": " + issue.message)
            .join(" "),
      );
    } else showError(error.message);
  }
  $("#save").onclick = async () => {
    if (saving) return;
    lockEditor(true);
    $("#save-state").textContent = "Salvando…";
    $("#app-message").hidden = true;
    try {
      const result = await api("content", {
        method: "PUT",
        body: JSON.stringify({ data, etag }),
      });
      data = result.data;
      etag = result.etag;
      baseline = JSON.stringify(data);
      notify("Alterações publicadas.");
      $("#admin-name").textContent = data.hero.name;
      $("#admin-avatar").src = assetSrc(data.about.image);
      render();
    } catch (error) {
      fieldErrors(error);
    } finally {
      lockEditor(false);
    }
  };
  $("#preview").onclick = async () => {
    try {
      const result = await api("validate", {
        method: "POST",
        body: JSON.stringify({ data }),
      });
      sessionStorage.setItem("portfolio-preview", JSON.stringify(result.data));
      $("#preview-frame").src = "/?preview=1&t=" + Date.now();
      $("#preview-dialog").showModal();
    } catch (error) {
      fieldErrors(error);
    }
  };
  $("#preview-close").onclick = () => $("#preview-dialog").close();
  $("#preview-dialog").addEventListener("close", () => {
    $("#preview-frame").src = "about:blank";
    sessionStorage.removeItem("portfolio-preview");
  });
  $("#preview-mobile").onclick = () =>
    $("#preview-frame").classList.add("mobile");
  $("#preview-desktop").onclick = () =>
    $("#preview-frame").classList.remove("mobile");
  $("#export-json").onclick = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      }),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = "portfolio-" + new Date().toISOString().slice(0, 10) + ".json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  $("#import-json").onchange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      if (file.size > 600000) throw Error("O arquivo é muito grande.");
      const value = JSON.parse(await file.text());
      const result = await api("validate", {
        method: "POST",
        body: JSON.stringify({ data: value }),
      });
      if (
        await ask(
          "Importar conteúdo?",
          "O arquivo substituirá o rascunho. A publicação só muda ao salvar.",
        )
      ) {
        data = result.data;
        changed();
        render();
        notify("Conteúdo importado para o rascunho.");
      }
    } catch (error) {
      showError(error.message);
    } finally {
      event.target.value = "";
    }
  };
  $("#discard").onclick = async () => {
    if (
      await ask(
        "Descartar alterações?",
        "Seu rascunho será substituído pela versão publicada.",
      )
    ) {
      const result = await api("content");
      data = result.data;
      etag = result.etag;
      baseline = JSON.stringify(data);
      changed();
      render();
    }
  };
  $("#backup-list").onclick = async (event) => {
    const button = event.target.closest("[data-restore]");
    if (!button) return;
    try {
      if (
        await ask(
          "Restaurar versão?",
          "Esta versão será carregada como rascunho. Salve para publicá-la.",
        )
      ) {
        const result = await api("backups/" + button.dataset.restore);
        data = result.data;
        changed();
        render();
        notify("Versão restaurada no rascunho.");
      }
    } catch (error) {
      showError(error.message);
    }
  };
  $("#password-form").onsubmit = async (event) => {
    event.preventDefault();
    const button = event.target.querySelector("button");
    button.disabled = true;
    try {
      const values = Object.fromEntries(new FormData(event.target));
      const result = await api("password", {
        method: "POST",
        body: JSON.stringify(values),
      });
      csrf = result.csrf;
      event.target.reset();
      notify("Senha alterada. Outras sessões foram encerradas.");
    } catch (error) {
      showError(error.message);
    } finally {
      button.disabled = false;
    }
  };
  async function enterApp() {
    session = await api("session");
    csrf = session.csrf;
    if (!dirty) {
      const result = await api("content");
      data = result.data;
      etag = result.etag;
      baseline = JSON.stringify(data);
    }
    $("#auth").hidden = true;
    $("#app").hidden = false;
    $("#admin-name").textContent = data.hero.name;
    $("#admin-avatar").src = assetSrc(data.about.image);
    $("#environment").textContent = session.local
      ? "Ambiente local"
      : "Site publicado";
    changed();
    render();
  }
  async function boot() {
    try {
      session = await api("session");
      if (session.authenticated) {
        await enterApp();
        return;
      }
      $("#auth-title").textContent = session.needsSetup
        ? "Criar administrador"
        : "Entrar no painel";
      $("#auth-subtitle").textContent = session.needsSetup
        ? "Defina seu acesso ao portfólio."
        : "Seu portfólio, do seu jeito.";
      $("#auth-submit").textContent = session.needsSetup
        ? "Criar acesso"
        : "Entrar";
      $("#confirm-label").hidden = !session.needsSetup;
      $("#setup-label").hidden = !session.needsSetup || session.local;
      $("#auth-form [name=password]").minLength = session.needsSetup ? 12 : 1;
      if (session.needsSetup && !session.setupAllowed) {
        showError(
          "Ativação pendente: configure ADMIN_SETUP_TOKEN na Netlify com uma chave de pelo menos 24 caracteres e publique novamente.",
          true,
        );
        $("#auth-submit").disabled = true;
      }
    } catch (error) {
      showError(
        "O servidor do ADM não respondeu. Abra o painel pelo endereço do servidor ou pelo site publicado.",
        true,
      );
      $("#auth-submit").disabled = true;
    }
  }
  $("#auth-form").onsubmit = async (event) => {
    event.preventDefault();
    $("#auth-message").hidden = true;
    const values = Object.fromEntries(new FormData(event.target)),
      button = $("#auth-submit");
    if (session?.needsSetup && values.password !== values.confirm) {
      showError("As senhas não conferem.", true);
      return;
    }
    button.disabled = true;
    try {
      const result = await api(session?.needsSetup ? "setup" : "login", {
        method: "POST",
        body: JSON.stringify(values),
      });
      csrf = result.csrf;
      event.target.reset();
      await enterApp();
    } catch (error) {
      showError(error.message, true);
    } finally {
      button.disabled = false;
    }
  };
  $("#show-password").onclick = () => {
    const input = $("#auth-form [name=password]"),
      visible = input.type === "password";
    input.type = visible ? "text" : "password";
    $("#show-password").title = visible ? "Ocultar senha" : "Mostrar senha";
    $("#show-password").setAttribute("aria-label", $("#show-password").title);
  };
  $("#logout").onclick = async () => {
    if (
      dirty &&
      !(await ask(
        "Sair sem salvar?",
        "As alterações não salvas serão descartadas.",
      ))
    )
      return;
    try {
      await api("logout", { method: "POST" });
      dirty = false;
      location.reload();
    } catch (error) {
      showError(error.message);
    }
  };
  $("#editor-nav").innerHTML = pages
    .map(
      ([id, label, icon]) =>
        '<button type="button" data-page="' +
        id +
        '"><i class="' +
        icon +
        '" aria-hidden="true"></i>' +
        label +
        "</button>",
    )
    .join("");
  $("#editor-nav").onclick = (event) => {
    const button = event.target.closest("[data-page]");
    if (button) {
      page = button.dataset.page;
      render();
      window.scrollTo({ top: 0 });
    }
  };
  window.addEventListener("beforeunload", (event) => {
    if (dirty) {
      event.preventDefault();
      event.returnValue = "";
    }
  });
  boot();
})();
