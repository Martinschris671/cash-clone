// --- Feedback Overlay Logic ---

// DOM Elements (Initialize will grab these)
let feedbackOverlay,
  feedbackCloseBtn,
  feedbackStarRating,
  feedbackStars,
  feedbackComment,
  feedbackCancelBtn,
  feedbackSubmitBtn,
  feedbackThankYou,
  feedbackThankYouCloseBtn;

// State & Constants
let currentRating = 0;
// !!! IMPORTANT: Keep your actual URL here !!!
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbw9iOxCBi5P43CB86iW0DZ0gOgHk1B_ptg0RLRNqwW3Y-EUEkp3UvavV2cKU2XKmJ8/exec";
const FEEDBACK_SUBMITTED_KEY = "userFeedbackSubmitted_v1";
const FEEDBACK_CLOSED_KEY = "userFeedbackClosedTimestamp_v1";
const FEEDBACK_COOLDOWN_MINUTES = 30; // Cooldown if closed
const FEEDBACK_INITIAL_DELAY_MS = 60000; // 1 minute
let feedbackTimerId = null;

// --- Functions ---
function updateStarsVisuals(rating) {
  if (!feedbackStarRating) return;
  feedbackStarRating.className = "feedback-star-rating"; // Reset classes
  if (rating > 0) {
    feedbackStarRating.classList.add(`rating-${rating}`);
  }
}

function openFeedbackOverlay() {
  const hasSubmitted = localStorage.getItem(FEEDBACK_SUBMITTED_KEY) === "true";
  if (hasSubmitted || !feedbackOverlay) {
    console.log("Feedback submitted or overlay missing.");
    return;
  }
  console.log("Opening feedback overlay");
  currentRating = 0;
  updateStarsVisuals(currentRating);
  if (feedbackComment) feedbackComment.value = "";
  if (feedbackSubmitBtn) feedbackSubmitBtn.disabled = true;
  if (feedbackThankYou) feedbackThankYou.classList.remove("show");
  feedbackOverlay.classList.remove("hide");
  feedbackOverlay.classList.add("show");
  if (feedbackTimerId) clearTimeout(feedbackTimerId);
  feedbackTimerId = null;
}

function closeFeedbackOverlay(isCancel = true) {
  if (!feedbackOverlay) return;
  console.log(
    "Closing feedback overlay",
    isCancel ? "(User Closed)" : "(After Thanks)"
  );
  if (isCancel) {
    localStorage.setItem(FEEDBACK_CLOSED_KEY, Date.now().toString());
    console.log("Stored feedback close timestamp.");
    // Reschedule check after cooldown
    checkAndScheduleFeedbackPopup(FEEDBACK_COOLDOWN_MINUTES * 60 * 1000);
  }
  feedbackOverlay.classList.add("hide");
  setTimeout(() => {
    if (feedbackOverlay) {
      // Check again in case element removed during delay
      feedbackOverlay.classList.remove("show");
      feedbackOverlay.classList.remove("hide");
    }
  }, 300);
}

function submitFeedback() {
  if (!feedbackSubmitBtn || feedbackSubmitBtn.disabled) return;
  if (!APPS_SCRIPT_URL) {
    console.error("APPS_SCRIPT_URL not set!");
    alert("Cannot submit feedback.");
    return;
  }

  const comment = feedbackComment ? feedbackComment.value.trim() : "";
  const timestamp = new Date().toISOString();
  const feedbackData = {
    rating: currentRating,
    comment: comment,
    timestamp: timestamp,
    page: window.location.pathname || "Unknown",
  };

  console.log("Submitting Feedback:", feedbackData);
  feedbackSubmitBtn.disabled = true;
  feedbackSubmitBtn.textContent = "Submitting...";

  fetch(APPS_SCRIPT_URL, { method: "POST", body: JSON.stringify(feedbackData) })
    .then((response) => {
      console.log("GAS Fetch completed. Status:", response.status);
    })
    .catch((error) => {
      console.error("Error submitting feedback:", error);
      alert("Error submitting feedback.");
    })
    .finally(() => {
      localStorage.setItem(FEEDBACK_SUBMITTED_KEY, "true");
      localStorage.removeItem(FEEDBACK_CLOSED_KEY);
      console.log("Marked feedback as submitted.");
      if (feedbackThankYou) feedbackThankYou.classList.add("show");
      if (feedbackSubmitBtn) {
        feedbackSubmitBtn.textContent = "Submit Feedback";
        feedbackSubmitBtn.disabled = true;
      }
    });
}

// --- Check and Schedule Function ---
function checkAndScheduleFeedbackPopup(delay = FEEDBACK_INITIAL_DELAY_MS) {
  if (feedbackTimerId) {
    clearTimeout(feedbackTimerId);
    feedbackTimerId = null;
    console.log("Cleared existing feedback timer.");
  }

  const hasSubmitted = localStorage.getItem(FEEDBACK_SUBMITTED_KEY) === "true";
  if (hasSubmitted) {
    console.log("Feedback already submitted.");
    return;
  }

  const closedTimestamp = parseInt(
    localStorage.getItem(FEEDBACK_CLOSED_KEY) || "0",
    10
  );
  const now = Date.now();
  const cooldownMs = FEEDBACK_COOLDOWN_MINUTES * 60 * 1000;
  const timeSinceClosed = now - closedTimestamp;

  if (closedTimestamp > 0 && timeSinceClosed < cooldownMs) {
    const remainingCooldownMs = cooldownMs - timeSinceClosed;
    const minutesRemaining = Math.ceil(remainingCooldownMs / 60000);
    console.log(
      `Feedback cooldown active (~${minutesRemaining} min left). Rescheduling check.`
    );
    feedbackTimerId = setTimeout(() => {
      checkAndScheduleFeedbackPopup();
    }, remainingCooldownMs + 1000);
    return;
  }

  if (closedTimestamp > 0) {
    localStorage.removeItem(FEEDBACK_CLOSED_KEY);
    console.log("Feedback cooldown passed.");
  }

  console.log(`Scheduling feedback overlay in ${delay / 1000} seconds.`);
  feedbackTimerId = setTimeout(openFeedbackOverlay, delay);
}

// --- Initialize Feedback Components & Listeners ---
function initializeFeedbackOverlay() {
  console.log("Initializing feedback overlay...");
  feedbackOverlay = document.getElementById("feedback-overlay");
  feedbackCloseBtn = document.getElementById("feedback-modal-close-btn");
  feedbackStarRating = document.getElementById("feedback-star-rating");
  feedbackStars = feedbackStarRating
    ? feedbackStarRating.querySelectorAll(".star")
    : [];
  feedbackComment = document.getElementById("feedback-comment");
  feedbackCancelBtn = document.getElementById("feedback-cancel-btn");
  feedbackSubmitBtn = document.getElementById("feedback-submit-btn");
  feedbackThankYou = document.getElementById("feedback-thank-you");
  feedbackThankYouCloseBtn = document.getElementById(
    "feedback-thank-you-close-btn"
  );

  if (!feedbackOverlay || !feedbackStarRating || !feedbackSubmitBtn) {
    console.error("Essential feedback elements missing!");
    return;
  }

  // Add Listeners
  if (feedbackStarRating) {
    feedbackStarRating.addEventListener("mousemove", (e) => {
      if (!feedbackOverlay?.classList.contains("show")) return;
      const targetStar = e.target.closest(".star");
      if (targetStar)
        updateStarsVisuals(parseInt(targetStar.dataset.value, 10));
    });
    feedbackStarRating.addEventListener("mouseleave", () => {
      if (feedbackOverlay?.classList.contains("show"))
        updateStarsVisuals(currentRating);
    });
    feedbackStars.forEach((star) => {
      star.addEventListener("click", () => {
        if (!feedbackOverlay?.classList.contains("show")) return;
        currentRating = parseInt(star.dataset.value, 10);
        updateStarsVisuals(currentRating);
        if (feedbackSubmitBtn) feedbackSubmitBtn.disabled = false;
        console.log("Rating:", currentRating);
      });
    });
  }
  if (feedbackCloseBtn)
    feedbackCloseBtn.addEventListener("click", () =>
      closeFeedbackOverlay(true)
    );
  if (feedbackCancelBtn)
    feedbackCancelBtn.addEventListener("click", () =>
      closeFeedbackOverlay(true)
    );
  if (feedbackSubmitBtn)
    feedbackSubmitBtn.addEventListener("click", submitFeedback);
  if (feedbackThankYouCloseBtn)
    feedbackThankYouCloseBtn.addEventListener("click", () =>
      closeFeedbackOverlay(false)
    );
  if (feedbackOverlay) {
    feedbackOverlay.addEventListener("click", (event) => {
      if (event.target === feedbackOverlay) closeFeedbackOverlay(true);
    });
  }

  console.log("Feedback overlay initialized.");
}

// --- Initial Load Trigger ---
// This runs when the script is loaded, which should be after the DOM is ready if placed at the end of body
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initializeFeedbackOverlay();
    checkAndScheduleFeedbackPopup();
  });
} else {
  // DOM is already loaded
  initializeFeedbackOverlay();
  checkAndScheduleFeedbackPopup();
}
