const form = document.querySelector("#analyzeForm");
const usernameInput = document.querySelector("#usernameInput");
const statusMessage = document.querySelector("#statusMessage");
const resultGrid = document.querySelector("#resultGrid");
const dimensionList = document.querySelector("#dimensionList");
const evidenceList = document.querySelector("#evidenceList");
const detailTitle = document.querySelector("#detailTitle");
const detailBody = document.querySelector("#detailBody");
const selectedDimensionTitle = document.querySelector(
  "#selectedDimensionTitle",
);
const primaryAction = document.querySelector(".primary-action");
const limitOptions = Array.from(document.querySelectorAll(".limit-option"));
const quickSelectButtons = Array.from(
  document.querySelectorAll(".quick-select button"),
);

let selectedLimit = 10;
let latestData = null;

const dimensionDefinitions = [
  {
    key: "builder",
    oppositeKey: "explorer",
    title: "Build style",
    left: "Builder",
    right: "Explorer",
    detail:
      "Builder signal rises with complete repositories, maintenance, documentation, and steady commit activity.",
  },
  {
    key: "soloThinker",
    oppositeKey: "collaborator",
    title: "Work mode",
    left: "Solo Thinker",
    right: "Collaborator",
    detail:
      "Collaboration signal comes from forks, public traction, followers, and shared-project indicators.",
  },
  {
    key: "systematic",
    oppositeKey: "creative",
    title: "Execution style",
    left: "Systematic",
    right: "Creative",
    detail:
      "Systematic signal comes from documentation clarity, commit quality, and repository maintenance.",
  },
];

limitOptions.forEach((button) => {
  button.addEventListener("click", () => {
    selectedLimit = Number(button.dataset.limit);
    setSelected(limitOptions, button);
  });
});

quickSelectButtons.forEach((button) => {
  button.addEventListener("click", () => {
    usernameInput.value = button.dataset.user || "";
    setSelected(quickSelectButtons, button);
    form.requestSubmit();
  });
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const username = usernameInput.value.trim();
  if (!username) return;

  setLoading(true, `Analyzing ${username}...`);

  try {
    const response = await fetch(
      `/analyze/${encodeURIComponent(username)}?limit=${selectedLimit}`,
    );
    const payload = await response.json();

    if (!response.ok || !payload.success) {
      throw new Error(payload.message || "Analysis failed");
    }

    latestData = payload.data;
    renderAnalysis(latestData);
    setLoading(false, `Analysis ready for ${latestData.profile.username}.`);
  } catch (error) {
    setLoading(false, "");
    showError(error instanceof Error ? error.message : "Analysis failed");
  }
});

function renderAnalysis(data) {
  resultGrid.classList.remove("is-empty");

  document.querySelector("#personaName").textContent = data.persona.personaName;
  document.querySelector("#personaTagline").textContent = data.persona.tagline;
  document.querySelector("#confidenceValue").textContent =
    `${data.persona.confidence}`;
  document.querySelector("#typeCode").textContent = data.persona.typeCode;

  document.querySelector("#profileName").textContent =
    data.profile.name || data.profile.username;
  document.querySelector("#profileBio").textContent =
    data.profile.bio || "No public bio available.";
  document.querySelector("#profileLink").href = data.profile.url;
  document.querySelector("#repoCount").textContent = data.profile.publicRepos;
  document.querySelector("#followerCount").textContent = data.profile.followers;
  document.querySelector("#followingCount").textContent =
    data.profile.following;

  renderDimensions(data.persona.scores);
  renderEvidence(data.evidence);

  const firstCard = dimensionList.querySelector(".dimension-card");
  if (firstCard) firstCard.click();
}

function renderDimensions(scores) {
  dimensionList.innerHTML = "";

  dimensionDefinitions.forEach((dimension) => {
    const primaryScore = scores[dimension.key];
    const oppositeScore = scores[dimension.oppositeKey];
    const dominant =
      primaryScore >= oppositeScore ? dimension.left : dimension.right;
    const dominantScore = Math.max(primaryScore, oppositeScore);

    const card = document.createElement("button");
    card.type = "button";
    card.className = "dimension-card";

    const title = document.createElement("h3");
    title.textContent = dimension.title;

    const axisRow = document.createElement("div");
    axisRow.className = "axis-row";

    const leftLabel = document.createElement("span");
    leftLabel.textContent = dimension.left;

    const scorePair = document.createElement("strong");
    scorePair.textContent = `${primaryScore}/${oppositeScore}`;

    const rightLabel = document.createElement("span");
    rightLabel.textContent = dimension.right;

    const scoreTrack = document.createElement("div");
    scoreTrack.className = "score-track";

    const scoreFill = document.createElement("div");
    scoreFill.className = "score-fill";
    scoreFill.style.width = `${primaryScore}%`;

    const scoreNumber = document.createElement("div");
    scoreNumber.className = "score-number";
    scoreNumber.textContent = `${dominantScore}`;

    axisRow.append(leftLabel, scorePair, rightLabel);
    scoreTrack.append(scoreFill);
    card.append(title, axisRow, scoreTrack, scoreNumber);

    card.addEventListener("click", () => {
      setSelected(Array.from(dimensionList.children), card);
      selectedDimensionTitle.textContent = dimension.title;
      detailTitle.textContent = dominant;
      detailBody.textContent = dimension.detail;
    });

    dimensionList.appendChild(card);
  });
}

function renderEvidence(evidence) {
  evidenceList.innerHTML = "";

  evidence.forEach((item) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "evidence-card";

    const title = document.createElement("h3");
    title.textContent = item.label;

    const value = document.createElement("span");
    value.className = "evidence-value";
    value.textContent = `${item.value}`;

    const detail = document.createElement("p");
    detail.textContent = item.detail;

    card.append(title, value, detail);

    card.addEventListener("click", () => {
      setSelected(Array.from(evidenceList.children), card);
      detailTitle.textContent = item.label;
      detailBody.textContent = item.detail;
    });

    evidenceList.appendChild(card);
  });
}

function setSelected(items, selectedItem) {
  items.forEach((item) =>
    item.classList.toggle("is-selected", item === selectedItem),
  );
}

function setLoading(isLoading, message) {
  primaryAction.disabled = isLoading;
  primaryAction.textContent = isLoading ? "Analyzing" : "Analyze";
  statusMessage.textContent = message;
  statusMessage.style.color = "";
}

function showError(message) {
  statusMessage.textContent = message;
  statusMessage.style.color = "#b42318";
}

renderDimensions({
  builder: 0,
  explorer: 0,
  soloThinker: 0,
  collaborator: 0,
  systematic: 0,
  creative: 0,
});
