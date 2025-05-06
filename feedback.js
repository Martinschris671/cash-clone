// --- Feedback Overlay Logic ---
// Ensure elements are defined globally only if needed, otherwise grab inside functions/DOMContentLoaded
let feedbackOverlay,
  feedbackCloseBtn,
  feedbackStarRating,
  feedbackStars,
  feedbackComment,
  feedbackCancelBtn,
  feedbackSubmitBtn,
  feedbackThankYou,
  feedbackThankYouCloseBtn;

let currentRating = 0;
let feedbackTimerId = null; // To hold the timeout ID
const FEEDBACK_DELAY = 90000; // 90 seconds = 1.5 minutes (adjust as needed)
const FEEDBACK_INTERACTED_KEY = "feedbackOverlayInteracted"; // localStorage key
// !!! YOUR SPECIFIC URL IS NOW HERE !!!
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbw9iOxCBi5P43CB86iW0DZ0gOgHk1B_ptg0RLRNqwW3Y-EUEkp3UvavV2cKU2XKmJ8/exec";

function updateStars(rating) {
  if (!feedbackStars || feedbackStars.length === 0) return; // Guard clause
  feedbackStars.forEach((star) => {
    const starValue = parseInt(star.dataset.value, 10);
    star.classList.toggle("selected", starValue <= rating);
  });
}

// **NEW**: Function to mark interaction in localStorage
function markFeedbackAsInteracted() {
  try {
    localStorage.setItem(FEEDBACK_INTERACTED_KEY, "true");
    console.log("Feedback marked as interacted in localStorage.");
  } catch (e) {
    console.error("Failed to set localStorage item:", e);
  }
}

function openFeedbackOverlay() {
  if (!feedbackOverlay || feedbackOverlay.classList.contains("show")) return; // Prevent opening if already open
  console.log("Opening feedback overlay via timer or trigger.");

  if (feedbackTimerId) {
    clearTimeout(feedbackTimerId);
    feedbackTimerId = null;
    console.log("Cleared existing feedback timer.");
  }

  currentRating = 0; // Reset rating
  updateStars(currentRating); // Clear visual stars
  if (feedbackComment) feedbackComment.value = ""; // Clear comment
  if (feedbackSubmitBtn) feedbackSubmitBtn.disabled = true; // Disable submit initially
  if (feedbackThankYou) feedbackThankYou.classList.remove("show"); // Hide thank you message
  feedbackOverlay.classList.remove("hide"); // Remove hide class if present for animation
  feedbackOverlay.classList.add("show");
  // document.body.style.overflow = 'hidden'; // Optional: prevent body scroll
}

function closeFeedbackOverlay() {
  if (!feedbackOverlay || !feedbackOverlay.classList.contains("show")) return; // Only close if open
  console.log("Closing feedback overlay.");

  markFeedbackAsInteracted(); // **Mark as interacted when closed manually**

  feedbackOverlay.classList.add("hide"); // Add class for exit animation
  feedbackOverlay.addEventListener(
    "animationend",
    () => {
      feedbackOverlay.classList.remove("show");
      feedbackOverlay.classList.remove("hide");
      // document.body.style.overflow = ''; // Restore body scroll
    },
    { once: true }
  );
}

function submitFeedback() {
  if (!feedbackSubmitBtn || feedbackSubmitBtn.disabled || !APPS_SCRIPT_URL) {
    if (!APPS_SCRIPT_URL) console.error("APPS_SCRIPT_URL not set!");
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

  // **Send data to Google Apps Script using fetch**
  fetch(APPS_SCRIPT_URL, {
    method: "POST",
    // mode: 'no-cors', // Often needed, uncomment if you face CORS issues
    body: JSON.stringify(feedbackData),
  })
    .then((response) => {
      console.log("Feedback submission response status:", response.status);
    }) // Log status even for opaque response
    .catch((error) => {
      console.error("Error submitting feedback:", error);
      alert("Error submitting feedback.");
    })
    .finally(() => {
      // Show Thank You message regardless
      if (feedbackThankYou) feedbackThankYou.classList.add("show");
      if (feedbackSubmitBtn) feedbackSubmitBtn.textContent = "Submit Feedback"; // Reset text

      markFeedbackAsInteracted(); // **Mark as interacted on submit**
      if (feedbackTimerId) {
        clearTimeout(feedbackTimerId);
        feedbackTimerId = null;
      } // Clear timer
    });
}

// **NEW**: Function to initialize the automatic trigger
function initializeFeedbackTrigger() {
  let hasInteracted = false;
  try {
    hasInteracted = localStorage.getItem(FEEDBACK_INTERACTED_KEY) === "true";
  } catch (e) {
    console.error("Could not read localStorage:", e);
  }

  if (hasInteracted) {
    console.log("Feedback already interacted with.");
  } else {
    console.log(
      `Setting timer for feedback overlay: ${FEEDBACK_DELAY / 1000}s.`
    );
    if (feedbackTimerId) clearTimeout(feedbackTimerId);
    feedbackTimerId = setTimeout(() => {
      let checkAgain = false;
      try {
        checkAgain = localStorage.getItem(FEEDBACK_INTERACTED_KEY) === "true";
      } catch (e) {}
      if (!checkAgain) {
        openFeedbackOverlay();
      } else {
        console.log("Timer fired, but user interacted already.");
      }
    }, FEEDBACK_DELAY);
  }
}

// --- Setup Event Listeners (ensure DOM is ready) ---
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM Loaded, setting up feedback component.");

  // Grab elements now that DOM is ready
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

  if (
    !feedbackOverlay ||
    !feedbackStarRating ||
    !feedbackSubmitBtn ||
    !feedbackCancelBtn ||
    !feedbackCloseBtn ||
    !feedbackThankYou ||
    !feedbackThankYouCloseBtn
  ) {
    console.error(
      "Feedback overlay HTML elements not found. Cannot initialize."
    );
    return;
  }

  // Setup Star Rating Listeners
  if (feedbackStars.length > 0) {
    feedbackStars.forEach((star) => {
      star.addEventListener("mouseover", () => {
        if (feedbackOverlay?.classList.contains("show"))
          updateStars(parseInt(star.dataset.value, 10));
      });
      star.addEventListener("mouseout", () => {
        if (feedbackOverlay?.classList.contains("show"))
          updateStars(currentRating);
      });
      star.addEventListener("click", () => {
        if (feedbackOverlay?.classList.contains("show")) {
          currentRating = parseInt(star.dataset.value, 10);
          updateStars(currentRating);
          if (feedbackSubmitBtn) feedbackSubmitBtn.disabled = false;
          console.log("Rating:", currentRating);
        }
      });
    });
  } else {
    console.warn("Feedback stars not found.");
  }

  // Setup Button Listeners
  feedbackCloseBtn.addEventListener("click", closeFeedbackOverlay);
  feedbackCancelBtn.addEventListener("click", closeFeedbackOverlay);
  feedbackSubmitBtn.addEventListener("click", submitFeedback);
  feedbackThankYouCloseBtn.addEventListener("click", closeFeedbackOverlay);

  // Setup Overlay Click Listener
  feedbackOverlay.addEventListener("click", (event) => {
    if (event.target === feedbackOverlay) {
      closeFeedbackOverlay();
    }
  });

  // Initialize the automatic trigger logic
  initializeFeedbackTrigger();

  console.log("Feedback component initialized.");
});
