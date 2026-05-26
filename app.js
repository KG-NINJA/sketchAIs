const canvas = document.getElementById("drawCanvas");
const ctx = canvas.getContext("2d", { willReadFrequently: false });
const colorInput = document.getElementById("colorInput");
const sizeInput = document.getElementById("sizeInput");
const eraserBtn = document.getElementById("eraserBtn");
const specModeBtn = document.getElementById("specModeBtn");
const undoBtn = document.getElementById("undoBtn");
const clearBtn = document.getElementById("clearBtn");
const refreshBtn = document.getElementById("refreshBtn");
const promptInput = document.getElementById("promptInput");
const specPanel = document.getElementById("specPanel");
const loadAgentTemplateBtn = document.getElementById("loadAgentTemplateBtn");
const problemInput = document.getElementById("problemInput");
const structureInput = document.getElementById("structureInput");
const flowInput = document.getElementById("flowInput");
const statesInput = document.getElementById("statesInput");
const aiSelect = document.getElementById("aiSelect");
const customUrlField = document.getElementById("customUrlField");
const customUrlInput = document.getElementById("customUrlInput");
const sendBtn = document.getElementById("sendBtn");
const copyBtn = document.getElementById("copyBtn");
const markdownOutput = document.getElementById("markdownOutput");
const downloadPngBtn = document.getElementById("downloadPngBtn");
const downloadMdBtn = document.getElementById("downloadMdBtn");
const agentApiUrl = document.getElementById("agentApiUrl");
const copyAgentUrlBtn = document.getElementById("copyAgentUrlBtn");
const statusEl = document.getElementById("status");

let strokes = [];
let currentStroke = null;
let erasing = false;
let lastMarkdown = "";

function resizeCanvas() {
  const rect = canvas.parentElement.getBoundingClientRect();
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const snapshot = canvas.width ? canvas.toDataURL("image/png") : null;
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  clearCanvasOnly();
  if (snapshot) {
    const img = new Image();
    img.onload = () => redraw();
    img.src = snapshot;
  } else {
    redraw();
  }
}

function clearCanvasOnly() {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}

function pointFromEvent(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}

function drawStroke(stroke) {
  if (stroke.points.length < 1) return;
  ctx.save();
  ctx.globalCompositeOperation = stroke.erase ? "destination-out" : "source-over";
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.size;
  ctx.beginPath();
  ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
  for (const point of stroke.points.slice(1)) {
    ctx.lineTo(point.x, point.y);
  }
  if (stroke.points.length === 1) {
    const p = stroke.points[0];
    ctx.lineTo(p.x + 0.01, p.y + 0.01);
  }
  ctx.stroke();
  ctx.restore();
}

function redraw() {
  clearCanvasOnly();
  strokes.forEach(drawStroke);
  updateMarkdown();
}

function setStatus(text) {
  statusEl.textContent = text;
  if (text) window.clearTimeout(setStatus.timer);
  setStatus.timer = window.setTimeout(() => { statusEl.textContent = ""; }, 2600);
}

function markdownPayload() {
  const png = canvas.toDataURL("image/png");
  const prompt = promptInput.value.trim();
  const problem = problemInput.value.trim();
  const structure = structureInput.value.trim();
  const flow = flowInput.value.trim();
  const states = statesInput.value.trim();
  const strokeData = JSON.stringify({
    createdAt: new Date().toISOString(),
    canvas: {
      width: Math.round(canvas.getBoundingClientRect().width),
      height: Math.round(canvas.getBoundingClientRect().height)
    },
    strokes
  });
  return [
    "# Sketch to AI",
    "",
    "## Request",
    prompt || "\u3053\u306e\u30b9\u30b1\u30c3\u30c1\u3092\u5206\u6790\u3057\u3066\u304f\u3060\u3055\u3044\u3002",
    "",
    "## Machine Readable Spec",
    "",
    "### Problem / KPI",
    problem || "UNKNOWN",
    "",
    "### Structure IDs",
    blockListToTable(structure, ["ID", "Region / Purpose"]),
    "",
    "### Flow",
    blockListToTable(flow, ["ID", "Step"]),
    "",
    "### States",
    blockListToTable(states, ["State", "Meaning"]),
    "",
    "## Codex Extraction Prompt",
    "Read the image and structured notes. Return detected layout regions, unreadable labels, likely intended labels, interaction flow, missing states, normalized UI spec, and React component breakdown. Do not guess silently. Mark uncertain items as UNKNOWN.",
    "",
    "## Image",
    `![sketch](${png})`,
    "",
    "## Stroke JSON",
    "```json",
    strokeData,
    "```"
  ].join("\n");
}

function blockListToTable(text, headers) {
  const rows = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!rows.length) return "UNKNOWN";
  const body = rows.map((line) => {
    const parts = line.split(":");
    const first = parts.shift()?.trim() || "UNKNOWN";
    const rest = parts.join(":").trim() || "UNKNOWN";
    return `| ${first} | ${rest} |`;
  });
  return [`| ${headers[0]} | ${headers[1]} |`, "|---|---|", ...body].join("\n");
}

function updateMarkdown() {
  lastMarkdown = markdownPayload();
  markdownOutput.value = lastMarkdown;
}

async function copyMarkdown() {
  updateMarkdown();
  await navigator.clipboard.writeText(lastMarkdown);
  setStatus("Markdown\u3092\u30b3\u30d4\u30fc\u3057\u307e\u3057\u305f");
}

function aiUrl(markdown) {
  const text = encodeURIComponent(markdown.slice(0, 1800));
  const urls = {
    chatgpt: "https://chatgpt.com/",
    claude: "https://claude.ai/new",
    gemini: "https://gemini.google.com/app",
    perplexity: `https://www.perplexity.ai/search/new?q=${text}`
  };
  if (aiSelect.value === "custom") {
    const raw = customUrlInput.value.trim();
    return raw ? raw.replace("{text}", text) : "";
  }
  return urls[aiSelect.value];
}

async function sendToAi() {
  updateMarkdown();
  try {
    await navigator.clipboard.writeText(lastMarkdown);
  } catch (_) {
    setStatus("\u30b3\u30d4\u30fc\u6a29\u9650\u304c\u306a\u3044\u305f\u3081\u624b\u52d5\u30b3\u30d4\u30fc\u3057\u3066\u304f\u3060\u3055\u3044");
  }
  const url = aiUrl(lastMarkdown);
  if (!url) {
    setStatus("\u30ab\u30b9\u30bf\u30e0URL\u3092\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044");
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
  setStatus("Markdown copied. Paste it into the opened AI chat.");
}

function download(filename, type, content) {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

canvas.addEventListener("pointerdown", (event) => {
  canvas.setPointerCapture(event.pointerId);
  currentStroke = {
    color: colorInput.value,
    size: Number(sizeInput.value),
    erase: erasing,
    points: [pointFromEvent(event)]
  };
  drawStroke(currentStroke);
});

canvas.addEventListener("pointermove", (event) => {
  if (!currentStroke) return;
  currentStroke.points.push(pointFromEvent(event));
  drawStroke({
    ...currentStroke,
    points: currentStroke.points.slice(-2)
  });
});

function finishStroke() {
  if (!currentStroke) return;
  strokes.push(currentStroke);
  currentStroke = null;
  updateMarkdown();
}

canvas.addEventListener("pointerup", finishStroke);
canvas.addEventListener("pointercancel", finishStroke);
canvas.addEventListener("pointerleave", finishStroke);

eraserBtn.addEventListener("click", () => {
  erasing = !erasing;
  eraserBtn.setAttribute("aria-pressed", String(erasing));
});

specModeBtn.addEventListener("click", () => {
  const hidden = specPanel.classList.toggle("hidden");
  specModeBtn.setAttribute("aria-pressed", String(!hidden));
});

loadAgentTemplateBtn.addEventListener("click", () => {
  problemInput.value = "User Problem: Agents are difficult to monitor and debug.\nDesired Outcome: Understand agent state in under 5 seconds.\nPrimary KPI: Time-to-understand < 5 sec";
  structureInput.value = "A1: Status Header\nB1: Agent List\nC1: Current Task Panel\nD1: Timeline\nE1: Blockers Panel\nF1: Action Bar";
  flowInput.value = "ACT-1: User opens dashboard.\nAGENT-1: System ranks risky agents first.\nSTATE-1: Selected agent shows current task.\nERR-1: Blockers panel shows required action.";
  statesInput.value = "Running: Green, active work.\nWaiting: Yellow, needs input/tool/payment.\nFailed: Red, error occurred.\nIdle: Gray, no active task.\nReviewing: Blue, checking output.";
  updateMarkdown();
});

undoBtn.addEventListener("click", () => {
  strokes.pop();
  redraw();
});

clearBtn.addEventListener("click", () => {
  strokes = [];
  redraw();
});

refreshBtn.addEventListener("click", updateMarkdown);
promptInput.addEventListener("input", updateMarkdown);
[problemInput, structureInput, flowInput, statesInput].forEach((input) => {
  input.addEventListener("input", updateMarkdown);
});
aiSelect.addEventListener("change", () => {
  customUrlField.classList.toggle("hidden", aiSelect.value !== "custom");
});
sendBtn.addEventListener("click", sendToAi);
copyBtn.addEventListener("click", copyMarkdown);
downloadPngBtn.addEventListener("click", () => {
  canvas.toBlob((blob) => download("sketch.png", "image/png", blob), "image/png");
});
downloadMdBtn.addEventListener("click", () => {
  updateMarkdown();
  download("sketch.md", "text/markdown", lastMarkdown);
});

agentApiUrl.textContent = `${location.origin}/openapi.json`;
copyAgentUrlBtn.addEventListener("click", async () => {
  await navigator.clipboard.writeText(agentApiUrl.textContent);
  setStatus("Agent API URL copied");
});

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
