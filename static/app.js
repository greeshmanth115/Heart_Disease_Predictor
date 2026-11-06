const form = document.getElementById("patientForm");
const chopper = document.getElementById("chopper");
const wrap = document.getElementById("characterWrap");
const stage = document.getElementById("stage");
const title = document.getElementById("stageTitle");
const speech = document.getElementById("speech");
const resultEmpty = document.getElementById("resultEmpty");
const resultContent = document.getElementById("resultContent");
const resultBanner = document.getElementById("resultBanner");
const resultEmoji = document.getElementById("resultEmoji");
const resultTitle = document.getElementById("resultTitle");
const resultSubtitle = document.getElementById("resultSubtitle");
const predictionValue = document.getElementById("predictionValue");
const probability = document.getElementById("probability");
const meterFill = document.getElementById("meterFill");
const adviceList = document.getElementById("adviceList");
const askButton = form.querySelector(".ask");

const sprites = {
  check: "/static/assets/chopper_0.png",
  read: "/static/assets/chopper_1.png",
  happy: "/static/assets/chopper_2.png",
  serious: "/static/assets/chopper_3.png",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function setSprite(key) {
  chopper.src = sprites[key];
}
function setStage(n, text, line) {
  title.textContent = `${n} • ${text}`;
  speech.textContent = line;
}
function clearMotion() {
  wrap.classList.remove("running", "happy", "serious");
  stage.classList.remove("processing");
}

async function animatePrediction() {
  clearMotion();
  setSprite("check");
  setStage(1, "CHECKING YOUR DETAILS", "“Hmm… let me inspect this carefully!”");
  stage.classList.add("processing");
  await sleep(850);

  setSprite("read");
  setStage(
    2,
    "READING THE MEDICAL BOOK",
    "“I need to check my medical notes…!”",
  );
  await sleep(1500);

  setStage(3, "ANALYZING", "“Almost done… I found something!”");
  await sleep(1000);

  setSprite("happy");
  wrap.classList.add("running");
  setStage(4, "CHOPPER GIVES RESULT", "“I GOT THE RESULT!”");
  await sleep(1200);
  wrap.classList.remove("running");
}

function showResult(data) {
  const high = Number(data.prediction) === 1;
  setSprite(high ? "serious" : "happy");
  wrap.classList.toggle("serious", high);
  wrap.classList.toggle("happy", !high);
  resultEmpty.classList.add("hidden");
  resultContent.classList.remove("hidden");
  resultBanner.classList.toggle("danger", high);
  resultEmoji.textContent = high ? "🚨" : "💚";
  resultTitle.textContent = high ? "TAKE THIS SERIOUSLY!" : "GOOD NEWS!";
  resultSubtitle.textContent = high
    ? "The model indicates a higher likelihood."
    : "The model output is more reassuring.";
  predictionValue.textContent = high
    ? "Heart disease indicated"
    : "No heart disease indicated";
  probability.textContent = `${Number(data.probability).toFixed(2)}%`;
  requestAnimationFrame(
    () =>
      (meterFill.style.width = `${Math.min(100, Math.max(0, Number(data.probability)))}%`),
  );

  const advice = high
    ? [
        "Please discuss this result with a qualified healthcare professional.",
        "Do not treat this model output as a diagnosis.",
        "Keep track of blood pressure, cholesterol and other risk factors.",
        "Seek urgent medical help for severe or concerning symptoms.",
      ]
    : [
        "Keep a balanced diet and stay physically active.",
        "Continue monitoring blood pressure and cholesterol.",
        "Manage stress and maintain regular sleep.",
        "Keep up with routine health checkups.",
      ];
  adviceList.innerHTML = advice.map((x) => `<li>${x}</li>`).join("");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  askButton.disabled = true;
  askButton.innerHTML = "♥ CHOPPER IS CHECKING…";
  resultContent.classList.add("hidden");
  resultEmpty.classList.remove("hidden");
  meterFill.style.width = "0%";
  try {
    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());
    for (const k of Object.keys(payload)) payload[k] = Number(payload[k]);
    const animation = animatePrediction();
    const response = await fetch("/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Prediction failed");
    await animation;
    showResult(data);
    document
      .getElementById("resultCard")
      .scrollIntoView({ behavior: "smooth", block: "center" });
  } catch (err) {
    setSprite("serious");
    setStage("!", "ERROR", "“Uh-oh! Something went wrong with the model.”");
    resultEmpty.innerHTML = `<div class="heart-pulse">⚠</div><h3>Prediction error</h3><p>${err.message}</p>`;
  } finally {
    askButton.disabled = false;
    askButton.innerHTML = "<span>♥</span> ASK CHOPPER <small>ENTER</small>";
  }
});

window.addEventListener("keydown", (e) => {
  if (
    e.key === "Enter" &&
    document.activeElement?.tagName !== "BUTTON" &&
    document.activeElement?.tagName !== "SELECT"
  ) {
    // Native form submission handles the actual prediction.
  }
});
