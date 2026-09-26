const DEFAULT = ["#ff8a6a", "#2a3540", "#5ab4c8", "#f4e4c1", "#1a2229"];
const labels = ["Primary", "Surface", "Accent", "Highlight", "Deep"];

/** @type {string[]} */
let colors = loadColors();

const swatchesEl = document.getElementById("swatches");
const pairsEl = document.getElementById("pairs");
const cssOut = document.getElementById("css-out");
const mock = document.getElementById("mock");

document.getElementById("btn-random").addEventListener("click", () => {
  colors = Array.from({ length: 5 }, () => randomHex());
  persist();
  render();
});

document.getElementById("btn-copy").addEventListener("click", async () => {
  await navigator.clipboard.writeText(cssOut.textContent);
  const btn = document.getElementById("btn-copy");
  const prev = btn.textContent;
  btn.textContent = "Copied!";
  setTimeout(() => (btn.textContent = prev), 1500);
});

function loadColors() {
  try {
    const raw = localStorage.getItem("palette-story-v1");
    return raw ? JSON.parse(raw) : [...DEFAULT];
  } catch {
    return [...DEFAULT];
  }
}

function persist() {
  localStorage.setItem("palette-story-v1", JSON.stringify(colors));
}

function randomHex() {
  return "#" + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0");
}

function luminance(hex) {
  const rgb = hexToRgb(hex);
  const [r, g, b] = rgb.map((c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function textOn(bg) {
  return luminance(bg) > 0.45 ? "#0c0f12" : "#f5f7fa";
}

function render() {
  swatchesEl.innerHTML = "";
  colors.forEach((c, i) => {
    const row = document.createElement("div");
    row.className = "swatch-row";
    row.innerHTML = `
      <input type="color" value="${c}" aria-label="${labels[i]} color" />
      <input type="text" value="${c}" maxlength="7" />
      <span>${labels[i]}</span>`;
    const colorIn = row.querySelector('[type="color"]');
    const textIn = row.querySelector('[type="text"]');
    colorIn.addEventListener("input", () => {
      colors[i] = colorIn.value;
      textIn.value = colorIn.value;
      persist();
      updateDerived();
    });
    textIn.addEventListener("change", () => {
      let v = textIn.value.trim();
      if (!v.startsWith("#")) v = "#" + v;
      if (!/^#[0-9a-fA-F]{6}$/.test(v)) {
        textIn.value = colors[i];
        return;
      }
      colors[i] = v.toLowerCase();
      colorIn.value = colors[i];
      persist();
      updateDerived();
    });
    swatchesEl.appendChild(row);
  });
  updateDerived();
}

function updateDerived() {
  const [primary, surface, accent, highlight, deep] = colors;
  const css = `:root {
  --brand-primary: ${primary};
  --brand-surface: ${surface};
  --brand-accent: ${accent};
  --brand-highlight: ${highlight};
  --brand-deep: ${deep};
  --text-on-primary: ${textOn(primary)};
  --text-on-surface: ${textOn(surface)};
}`;
  cssOut.textContent = css;

  pairsEl.innerHTML = "";
  const combos = [
    ["Primary on Surface", primary, surface],
    ["Accent on Deep", accent, deep],
    ["Highlight on Surface", highlight, surface],
    ["Primary on Highlight", primary, highlight],
  ];
  combos.forEach(([name, fg, bg]) => {
    const ratio = contrast(fg, bg);
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${name}</span>
      <div class="pair-chip"><span style="background:${fg}"></span><span style="background:${bg}"></span></div>
      <span class="ratio ${ratio >= 4.5 ? "pass" : ""}">${ratio.toFixed(2)}:1</span>`;
    pairsEl.appendChild(li);
  });

  mock.style.background = deep;
  mock.style.color = textOn(deep);
  const nav = mock.querySelector(".mock-nav");
  nav.style.background = surface;
  nav.style.color = textOn(surface);
  const card = mock.querySelector(".mock-card");
  card.style.background = highlight;
  card.style.color = textOn(highlight);
  const btn = mock.querySelector(".mock-btn");
  btn.style.background = primary;
  btn.style.color = textOn(primary);
}

render();
