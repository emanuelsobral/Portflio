//Dot Navigator
document.querySelector('.navbar').addEventListener('click', (e) => {

  if (e.target.tagName.toLowerCase() === 'a') {

    document.querySelectorAll('.navbar a')
      .forEach(e => e.classList.remove('active'));

    e.target.classList.add('active');

  }
});

//automatic active nav
const sections = document.querySelectorAll('section');
const config = {
  rootMargin: '0px',
  threshold: 0.7
};

let observer = new IntersectionObserver(function (entries, self) {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      let currentLink = document.querySelector(`.navbar a[href="#${entry.target.id}"]`);
      document.querySelectorAll('.navbar a')
        .forEach(e => e.classList.remove('active'));
      currentLink.classList.add('active');
    }
  });
}, config);

sections.forEach(section => {
  observer.observe(section);
});

//roll down remove

window.addEventListener("scroll", (event) => {
  let scroll = this.scrollY;

  if (scroll > 150) {
    const rollDown = document.getElementById('rollDown')
    rollDown.style.display = 'none';
  }
  if (scroll < 150) {
    const rollDown = document.getElementById('rollDown')
    rollDown.style.display = 'flex';
  }

  if (viewportWidth < 768) {
    if (scroll > 150) {
      const scrollUp = document.getElementById('scrollTop')
      scrollUp.style.display = 'flex';
    }
    if (scroll < 150) {
      const scrollUp = document.getElementById('scrollTop')
      scrollUp.style.display = 'none';
    }
  }
});

function scrollToTop() {
  const scrollToTop = document.getElementById('scrollToTop')
  scrollToTop.click();
}


//Type Effect

const typedTextSpan = document.querySelector(".typed-text");
const cursorSpan = document.querySelector(".cursor");

const textArray = ["DEVELOPER", "STUDENT"];
const typingDelay = 200;
const erasingDelay = 100;
const newTextDelay = 2000; // Delay between current and next text
let textArrayIndex = 0;
let charIndex = 0;

function type() {
  if (charIndex < textArray[textArrayIndex].length) {
    if (!cursorSpan.classList.contains("typing")) cursorSpan.classList.add("typing");
    typedTextSpan.textContent += textArray[textArrayIndex].charAt(charIndex);
    charIndex++;
    setTimeout(type, typingDelay);
  }
  else {
    cursorSpan.classList.remove("typing");
    setTimeout(erase, newTextDelay);
  }
}

function erase() {
  if (charIndex > 0) {
    if (!cursorSpan.classList.contains("typing")) cursorSpan.classList.add("typing");
    typedTextSpan.textContent = textArray[textArrayIndex].substring(0, charIndex - 1);
    charIndex--;
    setTimeout(erase, erasingDelay);
  }
  else {
    cursorSpan.classList.remove("typing");
    textArrayIndex++;
    if (textArrayIndex >= textArray.length) textArrayIndex = 0;
    setTimeout(type, typingDelay + 1100);
  }
}

document.addEventListener("DOMContentLoaded", function () { // On DOM Load initiate the effect
  if (textArray.length) setTimeout(type, newTextDelay + 250);
});

//PopUp Download

const popUpButton = document.getElementById('popUpButton');
const popUpButtonMobile = document.getElementById('popUpButtonMobile');
const closePopUp = document.getElementById('popUpClose');

popUpButton.addEventListener('click', () => {
  const popUp = document.getElementById('popUpDownload');
  popUp.style.display = 'flex';

});

popUpButtonMobile.addEventListener('click', () => {
  const popUp = document.getElementById('popUpDownload');
  popUp.style.display = 'flex';

});

closePopUp.addEventListener('click', () => {
  const popUp = document.getElementById('popUpDownload');
  popUp.style.display = 'none';
});

function ClickWord() {
  const curriculoWord = document.getElementById('curriculoWord');
  curriculoWord.click();
}

function ClickPdf() {
  const curriculoPDF = document.getElementById('curriculoPdf');
  curriculoPDF.click();
}

//About

const formacao = document.getElementById('formacaoButton');
const experiencia = document.getElementById('experienciaButton');
const cursos = document.getElementById('cursosButton');

formacao.addEventListener('click', () => {
  formacao.classList.add('active');
  experiencia.classList.remove('active');
  cursos.classList.remove('active');

  const formacaoContent = document.getElementById('formacao');
  const experienciaContent = document.getElementById('experiencia');
  const cursosContent = document.getElementById('cursos');

  formacaoContent.style.display = 'grid';
  experienciaContent.style.display = 'none';
  cursosContent.style.display = 'none';
})

experiencia.addEventListener('click', () => {
  experiencia.classList.add('active');
  formacao.classList.remove('active');
  cursos.classList.remove('active');

  const formacaoContent = document.getElementById('formacao');
  const experienciaContent = document.getElementById('experiencia');
  const cursosContent = document.getElementById('cursos');

  formacaoContent.style.display = 'none';
  experienciaContent.style.display = 'grid';
  cursosContent.style.display = 'none';
})

cursos.addEventListener('click', () => {
  cursos.classList.add('active');
  experiencia.classList.remove('active');
  formacao.classList.remove('active');

  const formacaoContent = document.getElementById('formacao');
  const experienciaContent = document.getElementById('experiencia');
  const cursosContent = document.getElementById('cursos');

  formacaoContent.style.display = 'none';
  experienciaContent.style.display = 'none';
  cursosContent.style.display = 'grid';
})

//Techs

const html = document.getElementById("html");
const css = document.getElementById("css");
const js = document.getElementById("js");
const php = document.getElementById("php");
const node = document.getElementById("node");
const mysql = document.getElementById("mysql");
const python = document.getElementById("python");

const htmlInfo = document.getElementById("htmlInfo");
const cssInfo = document.getElementById("cssInfo");
const jsInfo = document.getElementById("jsInfo");
const phpInfo = document.getElementById("phpInfo");
const nodeInfo = document.getElementById("nodeInfo");
const mysqlInfo = document.getElementById("mysqlInfo");
const TechsInfo = document.getElementById("TechsInfo");
const pythonInfo = document.getElementById("pythonInfo");

const elements = ["html", "css", "js", "php", "node", "mysql", "python"];

elements.forEach(function (element) {
  var el = document.getElementById(element);
  var info = document.getElementById(element + "Info");

  el.addEventListener("mouseover", function (e) {
    e.preventDefault();
    info.style.display = "block";
    TechsInfo.style.display = "none";
  });

  el.addEventListener("mouseout", function (e) {
    e.preventDefault();
    info.style.display = "none";
    TechsInfo.style.display = "block";
  });
});

//port

const emBreveBox = document.getElementById('emBreveBox');
const jogoDaVelhaBox = document.getElementById('jogoDaVelhaBox');
const calculadoraBox = document.getElementById('calculadoraBox');
const cronometroBox = document.getElementById('cronometroBox');

function openEmBreveBox() {
  emBreveBox.style.display = 'grid';
  jogoDaVelhaBox.style.display = 'none';
  calculadoraBox.style.display = 'none';
  cronometroBox.style.display = 'none';
}

function openJogoDaVelhaBox() {
  emBreveBox.style.display = 'none';
  jogoDaVelhaBox.style.display = 'grid';
  calculadoraBox.style.display = 'none';
  cronometroBox.style.display = 'none';
}

function openCalculadoraBox() {
  emBreveBox.style.display = 'none';
  jogoDaVelhaBox.style.display = 'none';
  calculadoraBox.style.display = 'grid';
  cronometroBox.style.display = 'none';
}

function openCronometroBox() {
  emBreveBox.style.display = 'none';
  jogoDaVelhaBox.style.display = 'none';
  calculadoraBox.style.display = 'none';
  cronometroBox.style.display = 'grid';
}

function closeBox() {
  emBreveBox.style.display = 'none';
  jogoDaVelhaBox.style.display = 'none';
  calculadoraBox.style.display = 'none';
  cronometroBox.style.display = 'none';
}

function copyEmail() {
  const email = document.getElementById('email');
  const emailBox = document.getElementById('emailBox');
  const statusCopy = document.getElementById('statusCopy');

  navigator.clipboard.writeText(email.innerText);

  emailBox.classList.remove('emailCopy');
  emailBox.classList.add('emailCopied');

  statusCopy.innerText = "Copiado!";
  statusCopy.style.color = "#00ff00";

  email.innerText = "Email Copiado com Sucesso!"
  email.style.color = "#00ff00"

  setTimeout(() => {
    emailBox.classList.add('emailCopy');
    emailBox.classList.remove('emailCopied');

    statusCopy.innerText = "Click and Copy";
    statusCopy.style.color = "#bc6ff1";

    email.innerText = "emanuelssobral@gmail.com"
    email.style.color = "#fff"
  }, 1100);
}


//Techs Mobile

var viewportWidth = window.innerWidth;

if (viewportWidth <= 1000) {
  const html = document.getElementById("html");
  const css = document.getElementById("css");
  const js = document.getElementById("js");
  const php = document.getElementById("php");
  const node = document.getElementById("node");
  const mysql = document.getElementById("mysql");
  const python = document.getElementById("python");

  const htmlInfo = document.getElementById("htmlInfoMobile");
  const cssInfo = document.getElementById("cssInfoMobile");
  const jsInfo = document.getElementById("jsInfoMobile");
  const phpInfo = document.getElementById("phpInfoMobile");
  const nodeInfo = document.getElementById("nodeInfoMobile");
  const mysqlInfo = document.getElementById("mysqlInfoMobile");
  const pythonInfo = document.getElementById("pythonInfoMobile");

  const aboutTechMobile = document.getElementById("aboutTechMobile");
  const closseAboutTech = document.getElementById("closeAboutTechMobileButton");

  const elementsMobile = ["htmlInfoMobile", "cssInfoMobile", "jsInfoMobile", "phpInfoMobile", "nodeInfoMobile", "mysqlInfoMobile", "pythonInfoMobile"];

  closseAboutTech.addEventListener('click', () => {
    aboutTechMobile.style.display = "none";
  })

  html.addEventListener('click', () => {
    elementsMobile.forEach(function (element) {
      var info = document.getElementById(element);
      info.style.display = "none";
    });

    aboutTechMobile.style.display = "flex";
    htmlInfo.style.display = "grid";
  })

  css.addEventListener('click', () => {
    elementsMobile.forEach(function (element) {
      var info = document.getElementById(element);
      info.style.display = "none";
    });

    aboutTechMobile.style.display = "flex";
    cssInfo.style.display = "grid";
  })

  js.addEventListener('click', () => {
    elementsMobile.forEach(function (element) {
      var info = document.getElementById(element);
      info.style.display = "none";
    });

    aboutTechMobile.style.display = "flex";
    jsInfo.style.display = "grid";
  })

  php.addEventListener('click', () => {
    elementsMobile.forEach(function (element) {
      var info = document.getElementById(element);
      info.style.display = "none";
    });

    aboutTechMobile.style.display = "flex";
    phpInfo.style.display = "grid";
  })

  node.addEventListener('click', () => {
    elementsMobile.forEach(function (element) {
      var info = document.getElementById(element);
      info.style.display = "none";
    });

    aboutTechMobile.style.display = "flex";
    nodeInfo.style.display = "grid";
  })

  mysql.addEventListener('click', () => {
    elementsMobile.forEach(function (element) {
      var info = document.getElementById(element);
      info.style.display = "none";
    });

    aboutTechMobile.style.display = "flex";
    mysqlInfo.style.display = "grid";
  })

  python.addEventListener('click', () => {
    elementsMobile.forEach(function (element) {
      var info = document.getElementById(element);
      info.style.display = "none";
    });

    aboutTechMobile.style.display = "flex";
    pythonInfo.style.display = "grid";
  })

} else {
  aboutTechMobile.style.display = "none";
}



