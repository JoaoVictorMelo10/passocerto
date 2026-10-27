// Degrau de escada rolante cromado, girando no hero. three.js r160, sem dependencias externas.
import * as THREE from './three/three.module.min.js';

const canvas = document.getElementById('degrau');
const reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 50);

// ---------- estudio para o reflexo do cromo: fundo preto + paineis de luz ----------
function estudio() {
  const s = new THREE.Scene();
  s.background = new THREE.Color(0x000000);
  const painel = (w, h, cor, k, pos, alvo) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(cor).multiplyScalar(k), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(...alvo); s.add(m);
  };
  s.background = new THREE.Color(0x0a0a0a);
  painel(9, 3.5, 0xffffff, 2.5, [0, 6, 0.5], [0, 0, 0]);       // softbox de cima
  // anel de faixas verticais em volta, na altura do olhar: e o que desenha o cromo
  for (let k = 0; k < 10; k++) {
    const a = k / 10 * Math.PI * 2, r = 5;
    const cor = k === 3 ? 0xffd100 : 0xffffff;
    const k2 = k === 3 ? 4 : (k % 2 ? 1.6 : 5);
    painel(k % 2 ? 1.6 : 0.8, 5, cor, k2, [Math.cos(a) * r, 1.6, Math.sin(a) * r], [0, 1.2, 0]);
  }
  painel(12, 0.5, 0xffffff, 3, [0, 0.0, -6], [0, 0, 0]);       // horizonte
  painel(8, 8, 0x2a2d31, 1, [0, -5, 0], [0, 0, 0]);            // chao
  return s;
}
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(estudio(), 0.015).texture;

// ---------- materiais ----------
const cromo = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.07 });
const cromoEsc = new THREE.MeshStandardMaterial({ color: 0xe4e6e9, metalness: 1, roughness: 0.12 });
const amarelo = new THREE.MeshStandardMaterial({ color: 0xffd100, metalness: 0.15, roughness: 0.38 });
const borracha = new THREE.MeshStandardMaterial({ color: 0x141414, metalness: 0, roughness: 0.55 });

// ---------- geometria (metros: largura 1,0 / profundidade 0,40) ----------
const W = 1.0, D = 0.40, TOPO = 0.24, N = 62;
function montaDegrau() {
const degrau = new THREE.Group();

// helper: perfil desenhado no plano (z, y) e extrudado na largura (x)
function perfil(pontos, espessura, furos = []) {
  const sh = new THREE.Shape(pontos.map(([z, y]) => new THREE.Vector2(-z, y)));
  furos.forEach(f => sh.holes.push(new THREE.Path(f.map(([z, y]) => new THREE.Vector2(-z, y)))));
  const g = new THREE.ExtrudeGeometry(sh, { depth: espessura, bevelEnabled: false, curveSegments: 24 });
  g.rotateY(Math.PI / 2);            // extrusao vira o eixo x
  g.translate(-espessura / 2, 0, 0);
  return g;
}

// pisada: chapa + ranhuras (cleats)
const chapa = new THREE.Mesh(new THREE.BoxGeometry(W, 0.014, D), cromoEsc);
chapa.position.y = TOPO - 0.022; degrau.add(chapa);
const passo = (W - 0.03) / (N - 1);
const ripa = new THREE.InstancedMesh(new THREE.BoxGeometry(passo * 0.52, 0.02, D), cromo, N);
const mtx = new THREE.Matrix4();
for (let i = 0; i < N; i++) { mtx.makeTranslation(-W / 2 + 0.015 + i * passo, TOPO - 0.005, 0); ripa.setMatrixAt(i, mtx); }
degrau.add(ripa);

// faixas amarelas de demarcacao (laterais e borda da frente), como nos degraus reais
const faixa = (w, d, x, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.022, d), amarelo); m.position.set(x, TOPO - 0.004, z); degrau.add(m); };
faixa(0.03, D, -W / 2 + 0.015, 0);
faixa(0.03, D, W / 2 - 0.015, 0);
faixa(W, 0.03, 0, D / 2 - 0.015);

// espelho (riser) concavo atras da pisada, tambem com ranhuras
const arco = [];
const c = [0.33, 0.62], R = Math.hypot(-D / 2 - c[0], TOPO - c[1]);
const a0 = Math.atan2(TOPO - c[1], -D / 2 - c[0]), a1 = Math.atan2(0.02 - c[1], -0.06 - c[0]);
for (let k = 0; k <= 24; k++) { const a = a0 + (a1 - a0) * k / 24; arco.push([c[0] + R * Math.cos(a), c[1] + R * Math.sin(a)]); }
const faixaArco = (esp) => [...arco, ...arco.slice().reverse().map(([z, y]) => {
  const a = Math.atan2(y - c[1], z - c[0]); return [z + esp * Math.cos(a), y + esp * Math.sin(a)];
})];
const espelho = new THREE.Mesh(perfil(faixaArco(0.012), W - 0.02), cromoEsc);
espelho.position.x = 0; degrau.add(espelho);
const ripaArco = new THREE.InstancedMesh(perfil(faixaArco(-0.016), passo * 0.52), cromo, N);
for (let i = 0; i < N; i++) { mtx.makeTranslation(-W / 2 + 0.015 + i * passo, 0, 0); ripaArco.setMatrixAt(i, mtx); }
degrau.add(ripaArco);

// cavaletes laterais (yokes) com janela
const yoke = [[D / 2 - 0.01, TOPO - 0.02], [-D / 2 + 0.03, TOPO - 0.02], [-0.10, 0.03], [0.02, 0.0], [0.17, 0.08]];
const janela = [[0.12, 0.17], [-0.10, 0.17], [-0.05, 0.08], [0.06, 0.07]];
for (const s of [-1, 1]) {
  const m = new THREE.Mesh(perfil(yoke, 0.022, [janela]), cromoEsc);
  m.position.x = s * (W / 2 - 0.03); degrau.add(m);
}

// rolete do degrau (atras/embaixo) e eixo com roletes da corrente (frente)
function rolete(x, z, y, r) {
  const g = new THREE.Group();
  const roda = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.032, 48), borracha);
  roda.rotation.z = Math.PI / 2; g.add(roda);
  const cubo = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.45, r * 0.45, 0.036, 32), cromo);
  cubo.rotation.z = Math.PI / 2; g.add(cubo);
  g.position.set(x, y, z); degrau.add(g);
}
for (const s of [-1, 1]) rolete(s * (W / 2 + 0.02), -0.06, 0.035, 0.038);
const eixo = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, W + 0.16, 24), cromo);
eixo.rotation.z = Math.PI / 2; eixo.position.set(0, 0.085, 0.15); degrau.add(eixo);
for (const s of [-1, 1]) rolete(s * (W / 2 + 0.06), 0.15, 0.085, 0.036);

return degrau;
}
// tres degraus seguidos, subindo como numa escada rolante
const pivo = new THREE.Group(); scene.add(pivo);
const RISE = 0.21;
for (let i = 0; i < 3; i++) {
  const d = montaDegrau();
  d.position.set(0, i * RISE - RISE - 0.12, -i * D + D);
  pivo.add(d);
}

// ---------- camera, tamanho, interacao ----------
camera.position.set(1.9, 0.9, 1.9); camera.lookAt(0, -0.02, 0);
function tamanho() {
  const { width, height } = canvas.getBoundingClientRect();
  if (!width || !height) return;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.position.setLength(width / height < 1 ? 3.6 : 3.1);
  camera.updateProjectionMatrix();
}
new ResizeObserver(tamanho).observe(canvas); tamanho();

let ang = -0.9, alvo = ang, arrasto = null, inc = 0, incAlvo = 0;
canvas.addEventListener('pointerdown', e => { arrasto = { x: e.clientX, y: e.clientY, a: alvo, i: incAlvo }; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', e => {
  if (!arrasto) return;
  alvo = arrasto.a + (e.clientX - arrasto.x) * 0.008;
  incAlvo = Math.max(-0.35, Math.min(0.5, arrasto.i + (e.clientY - arrasto.y) * 0.004));
});
const solta = () => { arrasto = null; };
canvas.addEventListener('pointerup', solta); canvas.addEventListener('pointercancel', solta);

let visivel = true;
new IntersectionObserver(([e]) => { visivel = e.isIntersecting; }).observe(canvas);

function quadro() {
  requestAnimationFrame(quadro);
  if (!visivel) return;
  if (!arrasto && !reduz) alvo += 0.0018;
  ang += (alvo - ang) * 0.08; inc += (incAlvo - inc) * 0.08;
  pivo.rotation.y = ang; pivo.rotation.x = inc;
  renderer.render(scene, camera);
}
quadro();
canvas.dataset.pronto = '1';
