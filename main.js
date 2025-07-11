document.addEventListener("DOMContentLoaded", () => {
  // Configuração do Particles.js para o fundo da seção hero
  particlesJS("particles-js", {
    particles: {
      number: { value: 80, density: { enable: true, value_area: 800 } },
      color: { value: "#9d4edd" },
      shape: { type: "circle", stroke: { width: 0, color: "#000000" } },
      opacity: { value: 0.5, random: false },
      size: { value: 3, random: true },
      line_linked: {
        enable: true,
        distance: 150,
        color: "#5a189a",
        opacity: 0.4,
        width: 1,
      },
      move: {
        enable: true,
        speed: 4,
        direction: "none",
        random: false,
        straight: false,
        out_mode: "out",
        bounce: false,
      },
    },
    interactivity: {
      detect_on: "canvas",
      events: {
        onhover: { enable: true, mode: "grab" },
        onclick: { enable: true, mode: "push" },
        resize: true,
      },
      modes: {
        grab: { distance: 140, line_linked: { opacity: 1 } },
        push: { particles_nb: 4 },
      },
    },
    retina_detect: true,
  });

  // --- TYPEWRITER EFFECT ---
  const typewriterElement = document.getElementById("typewriter");
  if (typewriterElement) {
    const words = ["Estudante", "Front-End", "Back-End", "Dados"];
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    const typingDelay = 150;
    const erasingDelay = 100;
    const newWordDelay = 1500;

    function type() {
      if (!typewriterElement) return;
      const currentWord = words[wordIndex];
      if (!isDeleting) {
        typewriterElement.textContent = currentWord.substring(0, charIndex + 1);
        charIndex++;
      } else {
        typewriterElement.textContent = currentWord.substring(0, charIndex - 1);
        charIndex--;
      }
      if (!isDeleting && charIndex === currentWord.length) {
        isDeleting = true;
        setTimeout(type, newWordDelay);
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        wordIndex = (wordIndex + 1) % words.length;
        setTimeout(type, 500);
      } else {
        setTimeout(type, isDeleting ? erasingDelay : typingDelay);
      }
    }
    setTimeout(type, 1200);
  }

  // Adiciona fundo ao header ao rolar a página
  const header = document.getElementById("main-header");
  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  });

  // Animação de revelação de elementos ao rolar a página
  const revealElements = document.querySelectorAll(".scroll-reveal");
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    },
    { threshold: 0.1 }
  );
  revealElements.forEach((el) => {
    revealObserver.observe(el);
  });

      // --- LÓGICA DO MENU HAMBÚRGUER ---
    const menuToggle = document.getElementById('mobile-menu-toggle');
    const mainNav = document.getElementById('main-nav');
    const navLinks = mainNav.querySelectorAll('a');

    if (menuToggle && mainNav) {
        // Abre e fecha o menu ao clicar no ícone
        menuToggle.addEventListener('click', () => {
            mainNav.classList.toggle('active');
            
            // Troca o ícone de hambúrguer para 'X' e vice-versa
            const icon = menuToggle.querySelector('i');
            if (mainNav.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });

        // Fecha o menu ao clicar em um link
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (mainNav.classList.contains('active')) {
                    mainNav.classList.remove('active');
                    const icon = menuToggle.querySelector('i');
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            });
        });
    }


  // --- LÓGICA PARA TOOLTIP E DICA DAS HABILIDADES (VERSÃO FINAL) ---
  const skillDescriptions = {
    html5: "Linguagem de marcação para criar a estrutura de páginas web.",
    css3: "Usado para estilizar e dar vida às páginas web, controlando cores, fontes e layouts.",
    javascript:
      "Linguagem de programação que torna as páginas web interativas e dinâmicas.",
    nodejs:
      "Permite executar JavaScript no servidor, criando aplicações back-end rápidas e escaláveis.",
    python:
      "Linguagem versátil usada para desenvolvimento web, análise de dados e automação.",
    mysql:
      "Sistema de gerenciamento de banco de dados para armazenar e consultar dados de forma estruturada.",
    git: "Sistema de controle de versão essencial para rastrear mudanças no código e colaborar em equipe.",
    java: "Linguagem de programação robusta e orientada a objetos, amplamente usada em sistemas corporativos.",
    athena:
      "Serviço de consulta interativa da AWS que facilita a análise de dados em larga escala armazenados no Amazon S3 usando SQL padrão.",
  };

  const allSkillCards = document.querySelectorAll(".skill-card");
  const cardWithHint = document.querySelector(".skill-card.hint-animation");
  let hintAnimationStopped = false;
  let activeTooltip = null; // Variável para manter referência da tooltip ativa

  // Função para remover a tooltip que está no <body>
  const removeActiveTooltip = () => {
    if (activeTooltip) {
      activeTooltip.remove();
      activeTooltip = null;
    }
  };

  allSkillCards.forEach((card) => {
    card.addEventListener("click", (e) => {
      // Impede que o clique no card feche a tooltip imediatamente
      e.stopPropagation();

      // Lógica para parar a animação de dica no primeiro clique (mantida)
      if (!hintAnimationStopped && cardWithHint) {
        cardWithHint.classList.remove("hint-animation");
        const hintTooltip = cardWithHint.querySelector(".click-hint-tooltip");
        if (hintTooltip) {
          hintTooltip.remove();
        }
        hintAnimationStopped = true;
      }

      const skill = e.currentTarget.dataset.skill;
      const description = skillDescriptions?.[skill];

      // Se o card clicado for o mesmo que gerou a tooltip ativa, apenas a fechamos
      if (activeTooltip && activeTooltip.dataset.ownerSkill === skill) {
        removeActiveTooltip();
        return; // E paramos a execução
      }

      // Remove qualquer tooltip antiga antes de criar uma nova
      removeActiveTooltip();

      if (description) {
        // 1. Criar a tooltip
        const tooltip = document.createElement("div");
        tooltip.className = "skill-tooltip-popup";
        tooltip.textContent = description;
        // Guardamos uma referência para saber a qual skill ela pertence
        tooltip.dataset.ownerSkill = skill;

        // 2. Anexar diretamente ao <body>
        document.body.appendChild(tooltip);
        activeTooltip = tooltip; // Atualiza a referência da tooltip ativa

        // 3. Calcular a posição
        const cardRect = e.currentTarget.getBoundingClientRect();

        // Posicionar a tooltip abaixo do card, centralizada horizontalmente
        // Adicionamos window.scrollY porque getBoundingClientRect é relativo à janela de visualização
        const top = cardRect.bottom + window.scrollY + 20; // 8px de espaço
        const left = cardRect.left + cardRect.width / 2;

        // 4. Aplicar o estilo de posicionamento via JS
        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;
      }
    });
  });

  // Listener global para fechar a tooltip se o usuário clicar em qualquer outro lugar
  document.addEventListener("click", () => {
    removeActiveTooltip();
  });

  // --- INICIALIZAÇÃO DO CARROSSEL DE PROJETOS ---
  const swiper = new Swiper(".project-swiper", {
    loop: true,
    grabCursor: true,
    spaceBetween: 30,
    pagination: { el: ".swiper-pagination", clickable: true },
    navigation: {
      nextEl: ".swiper-button-next",
      prevEl: ".swiper-button-prev",
    },
    breakpoints: {
      640: { slidesPerView: 1, spaceBetween: 20 },
      768: { slidesPerView: 2, spaceBetween: 30 },
      1024: { slidesPerView: 3, spaceBetween: 30 },
    },
  });

  // --- LÓGICA DAS ABAS (HISTÓRICO) ---
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabPanels = document.querySelectorAll(".tab-panel");

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetTab = btn.dataset.tab;

      tabBtns.forEach((b) => b.classList.remove("active"));
      tabPanels.forEach((p) => p.classList.remove("active"));

      btn.classList.add("active");
      document.getElementById(targetTab + "-panel").classList.add("active");
    });
  });

  // --- LÓGICA PARA COPIAR E-MAIL ---
  const copyBtn = document.getElementById("copy-email-btn");
  const copyFeedback = document.getElementById("copy-feedback");

  if (copyBtn && copyFeedback) {
    const emailToCopy = "emanuelssobral@gmail.com";

    copyBtn.addEventListener("click", () => {
      navigator.clipboard
        .writeText(emailToCopy)
        .then(() => {
          copyFeedback.textContent = "E-mail copiado!";
          copyFeedback.classList.add("visible");

          setTimeout(() => {
            copyFeedback.classList.remove("visible");
          }, 2000);
        })
        .catch((err) => {
          console.error("Falha ao copiar o e-mail: ", err);
          copyFeedback.textContent = "Falha ao copiar!";
          copyFeedback.classList.add("visible");
          setTimeout(() => {
            copyFeedback.classList.remove("visible");
          }, 2000);
        });
    });
  }
});
