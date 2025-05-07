// Your Deployed Google Apps Script Web App URL
const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwLonLiEmZbCTY8nH-oxwqXep33Jd-zAevN-2Ev-s7LYrded6xAul7IzqTcObF_1LITjw/exec";

/**
 * Tracks an activity by sending data to the Google Sheet.
 * @param {string} action - A description of the action (e.g., "Page View", "Link Click").
 * @param {object} details - An object containing additional details.
 * @param {string} [userId] - Optional: The ID of the current user.
 */
async function trackActivity(action, details, userId) {
  const payload = {
    action: action,
    details: details,
    userId:
      userId ||
      localStorage.getItem("webapp_user_id") ||
      "Anonymous_" + Date.now(), // Basic anonymous ID
    userAgent: navigator.userAgent,
  };

  console.log("Sending to Apps Script:", payload); // For debugging in browser console

  try {
    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      mode: "cors", // Important for cross-origin requests
      cache: "no-cache",
      headers: {
        // 'Content-Type': 'application/json' // Not strictly needed for simple stringified POST
      },
      // Apps Script doPost(e) expects e.postData.contents to be a string.
      // To send JSON, we need to structure it slightly differently if not using 'application/json'
      // or ensure Apps Script parses it from e.postData.contents.
      // The simplest way for Apps Script to get raw POST body is to send it directly.
      // However, Google Apps Script doPost(e) often works best when data is sent
      // as 'application/x-www-form-urlencoded' or if you send it as a text string
      // and parse it. The provided Apps Script expects `JSON.parse(e.postData.contents)`.
      // Let's try sending it as a plain text string that is JSON.
      // If issues, we might need to change content type or how Apps Script reads it.
      redirect: "follow", // Follow redirects, if any
      body: JSON.stringify(payload), // Send the payload as a JSON string
    });

    // Check if the response is OK (status in the range 200-299)
    if (response.ok) {
      const result = await response.json(); // Assuming Apps Script returns JSON
      console.log("Tracking success:", result);
    } else {
      // If the response is not OK, log the status and statusText
      console.error(
        "Tracking error - Response not OK:",
        response.status,
        response.statusText
      );
      const errorText = await response.text(); // Get error text from Apps Script if any
      console.error("Apps Script error response:", errorText);
    }
  } catch (error) {
    console.error("Error tracking activity (network or other):", error);
  }
}

// --- Global Tracking Setup ---

// 1. Track Page View on every page load
window.addEventListener("DOMContentLoaded", () => {
  // Generate a simple unique ID for the user session if one doesn't exist
  if (!localStorage.getItem("webapp_user_id")) {
    localStorage.setItem(
      "webapp_user_id",
      "user_" + Date.now() + Math.random().toString(16).slice(2)
    );
  }

  trackActivity("Page View", {
    url: window.location.pathname, // e.g., /home.html, /pay.html
    title: document.title,
  });
});

// 2. Track clicks on all <a> Href links
// We'll attach this listener to the document body and use event delegation
// This is more efficient than attaching to every single link.
document.addEventListener("click", function (event) {
  // Check if the clicked element or its ancestor is an <a> tag with an href
  let targetElement = event.target;
  while (targetElement && targetElement.tagName !== "A") {
    targetElement = targetElement.parentElement;
  }

  if (
    targetElement &&
    targetElement.tagName === "A" &&
    targetElement.getAttribute("href")
  ) {
    const href = targetElement.getAttribute("href");
    const linkText =
      targetElement.textContent.trim() ||
      targetElement.innerText.trim() ||
      "N/A";

    // Don't track clicks on javascript:void(0) or # links that don't change page
    if (href && !href.startsWith("javascript:") && href !== "#") {
      trackActivity("Link Click", {
        clickedHref: href,
        linkText: linkText,
        currentPage: window.location.pathname,
      });
      // Note: If the link navigates away immediately, the fetch request might
      // sometimes be interrupted. For critical tracking, navigator.sendBeacon()
      // is more robust, but for general activity, fetch usually works.
    }
  }
});

// --- You can add more specific trackers below if needed ---
// For example, tracking clicks on specific buttons by ID:
/*
const specialButton = document.getElementById('mySpecialActionBtn');
if (specialButton) {
  specialButton.addEventListener('click', () => {
    trackActivity('Special Action', { buttonId: 'mySpecialActionBtn', details: 'User performed X' });
  });
}
*/
