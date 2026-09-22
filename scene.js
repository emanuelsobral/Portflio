(async () => {
  await window.portfolioReady;
  const theme = window.PORTFOLIO_CONTENT?.theme;
  if (theme?.scene === false) return;
  const host = document.querySelector("#hero-scene");
  const hero = document.querySelector("#hero");
  let renderer;
  try {
    if (!window.THREE) throw new Error("Three.js unavailable");
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "low-power",
    });
  } catch {
    document.body.classList.add("scene-unavailable");
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setClearColor(0x100c1c, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 60);
  camera.position.set(0, 0, 14);
  const sculpture = new THREE.Group();
  const code = new THREE.Group();
  sculpture.add(code);
  scene.add(sculpture);

  const studio = new THREE.Scene();
  studio.background = new THREE.Color(0x292036);
  const panelGeometry = new THREE.PlaneGeometry(12, 12);
  [
    [0xe8caff, 5, 4, 3],
    [0x9875e3, -5, 1, 2],
    [0x71dfdf, 0, -5, 1],
  ].forEach(([color, x, y, z]) => {
    const panel = new THREE.Mesh(
      panelGeometry,
      new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }),
    );
    panel.position.set(x, y, z);
    panel.lookAt(0, 0, 0);
    studio.add(panel);
  });
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(studio, 0.06);
  scene.environment = environment.texture;
  studio.traverse((object) => {
    if (object.isMesh) object.material.dispose();
  });
  panelGeometry.dispose();
  pmrem.dispose();

  // Extruded code brackets make the 3D asset part of the developer identity.
  const violet = new THREE.MeshPhysicalMaterial({
    color: theme?.primary || 0x9d4edd,
    metalness: 0.48,
    roughness: 0.24,
    clearcoat: 1,
  });
  const cyan = new THREE.MeshPhysicalMaterial({
    color: theme?.cyan || 0x71dfdf,
    metalness: 0.4,
    roughness: 0.24,
    clearcoat: 1,
  });
  const bracketShape = new THREE.Shape();
  [
    [0.35, 0.9],
    [-0.65, 0],
    [0.35, -0.9],
    [0.58, -0.64],
    [-0.12, 0],
    [0.58, 0.64],
  ].forEach(([x, y], index) => {
    if (index === 0) bracketShape.moveTo(x, y);
    else bracketShape.lineTo(x, y);
  });
  bracketShape.closePath();
  const bracketGeometry = new THREE.ExtrudeGeometry(bracketShape, {
    depth: 0.24,
    bevelEnabled: true,
    bevelThickness: 0.065,
    bevelSize: 0.065,
    bevelSegments: 3,
    steps: 1,
  });
  bracketGeometry.center();
  const left = new THREE.Mesh(bracketGeometry, violet);
  left.position.x = -1.28;
  const right = new THREE.Mesh(bracketGeometry, violet);
  right.rotation.z = Math.PI;
  right.position.x = 1.28;
  const slash = new THREE.Mesh(new THREE.BoxGeometry(0.23, 2.1, 0.28), cyan);
  slash.rotation.z = -0.3;
  code.add(left, slash, right);
  code.rotation.set(-0.12, -0.2, 0.03);
  scene.add(new THREE.HemisphereLight(0xf3e5ff, 0x241135, 2));
  const key = new THREE.DirectionalLight(0xffffff, 4);
  key.position.set(2, 5, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x71dfdf, 3);
  rim.position.set(-4, -1, 2);
  scene.add(rim);

  // A seeded particle network preserves the original background with real depth.
  const network = new THREE.Group();
  const positions = [];
  let seed = 42;
  function random() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  }
  for (let i = 0; i < 80; i++)
    positions.push(
      (random() - 0.5) * 27,
      (random() - 0.5) * 14,
      -3 - random() * 4,
    );
  const pointsGeometry = new THREE.BufferGeometry();
  pointsGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  network.add(
    new THREE.Points(
      pointsGeometry,
      new THREE.PointsMaterial({
        color: 0xc59de9,
        size: 0.035,
        transparent: true,
        opacity: 0.65,
        depthWrite: false,
      }),
    ),
  );
  const connections = [];
  for (let i = 0; i < positions.length; i += 3) {
    for (let j = i + 3; j < positions.length; j += 3) {
      const distance = Math.hypot(
        positions[i] - positions[j],
        positions[i + 1] - positions[j + 1],
        positions[i + 2] - positions[j + 2],
      );
      if (distance < 2.8)
        connections.push(
          ...positions.slice(i, i + 3),
          ...positions.slice(j, j + 3),
        );
    }
  }
  const linesGeometry = new THREE.BufferGeometry();
  linesGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(connections, 3),
  );
  network.add(
    new THREE.LineSegments(
      linesGeometry,
      new THREE.LineBasicMaterial({
        color: 0x9d75c6,
        transparent: true,
        opacity: 0.08,
        depthWrite: false,
      }),
    ),
  );
  scene.add(network);

  const pointer = { x: 0, y: 0 };
  let paused =
    matchMedia("(prefers-reduced-motion: reduce)").matches ||
    theme?.motion === false;
  let inView = true;
  let lost = false;
  let frame = 0;
  let previousTime = 0;
  let elapsed = 0;
  let mobile = false;
  function render() {
    if (!lost) renderer.render(scene, camera);
  }
  function resize() {
    const width = host.clientWidth,
      height = host.clientHeight;
    mobile = width <= 760;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    const viewHeight =
      2 * Math.tan(THREE.MathUtils.degToRad(17.5)) * camera.position.z;
    const heroRect = hero.getBoundingClientRect();
    const emblem = document
      .querySelector(".hero-emblem")
      .getBoundingClientRect();
    sculpture.scale.setScalar(((emblem.width / height) * viewHeight) / 4.7);
    const centerY = emblem.top - heroRect.top + emblem.height / 2;
    sculpture.position.set(0, (0.5 - centerY / height) * viewHeight, 0);
    render();
  }
  function animate(time) {
    frame = 0;
    if (paused || !inView || document.hidden || lost) return;
    elapsed += previousTime
      ? Math.min((time - previousTime) / 1000, 0.05) * (theme?.speed || 1)
      : 0;
    previousTime = time;
    code.rotation.y = -0.2 + Math.sin(elapsed * 0.65) * 0.3;
    code.rotation.z = Math.sin(elapsed * 0.4) * 0.045;
    code.position.y = Math.sin(elapsed * 0.9) * 0.09;
    sculpture.rotation.y += (pointer.x * 0.35 - sculpture.rotation.y) * 0.04;
    const scroll = Math.min(scrollY / hero.clientHeight, 1);
    sculpture.rotation.x +=
      (pointer.y * 0.18 + scroll * 0.25 - sculpture.rotation.x) * 0.04;
    network.rotation.y = Math.sin(elapsed * 0.06) * 0.12 + pointer.x * 0.012;
    network.rotation.z = Math.sin(elapsed * 0.05) * 0.025;
    render();
    frame = requestAnimationFrame(animate);
  }
  function sync() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
    if (!paused && inView && !document.hidden && !lost)
      frame = requestAnimationFrame(animate);
  }
  hero.addEventListener(
    "pointermove",
    (event) => {
      if (mobile || paused) return;
      const rect = hero.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    },
    { passive: true },
  );
  hero.addEventListener("pointerleave", () => {
    pointer.x = 0;
    pointer.y = 0;
  });
  addEventListener("portfolio-motion", (event) => {
    paused = event.detail.paused;
    sync();
  });
  document.addEventListener("visibilitychange", sync);
  new IntersectionObserver((entries) => {
    inView = entries[0].isIntersecting;
    sync();
  }).observe(hero);
  new ResizeObserver(resize).observe(host);
  renderer.domElement.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    lost = true;
    sync();
    document.body.classList.add("scene-unavailable");
  });
  renderer.domElement.addEventListener("webglcontextrestored", () => {
    lost = false;
    document.body.classList.remove("scene-unavailable");
    resize();
    sync();
  });
  document.fonts.ready.then(resize);
  resize();
  sync();
})();
