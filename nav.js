// nav.js - Centralized Navigation Logic (v2 - Renamed Variable)

document.addEventListener("DOMContentLoaded", () => {
  console.log("nav.js (v2): DOMContentLoaded");

  // **RENAMED VARIABLE**
  const footerNavButtons = document.querySelectorAll(".bottom-nav .nav-button");
  const navBalanceDisplay = document.getElementById("footer-balance-display");
  const localStorageBalanceKey = "cashAppBalance";

  // --- Balance Formatting ---
  function formatBalanceForNav(balance) {
    const number = Number(balance);
    if (isNaN(number)) {
      console.warn("Invalid balance for nav formatting:", balance);
      return "$---";
    }
    if (number >= 1000000) return `$${(number / 1000000).toFixed(1)}M`;
    else if (number >= 1000) return `$${(number / 1000).toFixed(1)}K`;
    else
      return `$${number.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
  }

  // --- Update Balance Display in Nav ---
  function updateNavBalance() {
    if (!navBalanceDisplay) return;
    const savedBalance = localStorage.getItem(localStorageBalanceKey);
    const currentBalance = parseFloat(savedBalance) || 0;
    navBalanceDisplay.textContent = formatBalanceForNav(currentBalance);
    console.log("Nav balance updated:", navBalanceDisplay.textContent);
  }

  // --- Set Active Nav Item ---
  function setActiveNav() {
    // **Use the new variable name**
    if (!footerNavButtons || footerNavButtons.length === 0) return;

    const currentPage = window.location.pathname.split("/").pop();
    console.log("Current page filename:", currentPage);

    const pageKeyMap = {
      // Map filenames back to keys
      "home.html": "home",
      "card.html": "card",
      "pay.html": "payment",
      "contact_pay.html": "payment",
      "pin.html": "payment",
      "search.html": "search",
      "history.html": "activity",
    };

    const activePageKey = pageKeyMap[currentPage];
    console.log("Active page key:", activePageKey);

    // **Use the new variable name**
    footerNavButtons.forEach((item) => {
      const itemPageKey = item.dataset.page;
      item.classList.toggle("active", itemPageKey === activePageKey);
    });
  }

  // --- Navigation ---
  function navigateTo(pageKey) {
    // **Using original filenames YOU PROVIDED**
    const pageMap = {
      home: "home.html", // Or 'home.html'
      card: "card.html",
      payment: "pay.html", // leads to amount entry
      search: "search.html", // leads to contact search
      activity: "history.html",
    };
    const targetPage = pageMap[pageKey];
    const currentPage = window.location.pathname.split("/").pop();

    console.log(`Navigate requested to: ${pageKey} -> ${targetPage}`);

    if (targetPage && targetPage !== currentPage) {
      localStorage.removeItem("pendingPaymentAmount");
      localStorage.removeItem("pendingRecipientData");
      localStorage.removeItem("pendingBalanceBefore");
      console.log("Cleared pending keys before navigation.");
      window.location.href = targetPage;
    } else if (!targetPage) {
      console.warn(`Nav target for '${pageKey}' not defined.`);
      alert(`Navigation for '${pageKey}' not implemented yet.`);
    } else {
      console.log(`Already on page: ${currentPage}`);
    }
  }

  // --- Initialization ---
  // **Use the new variable name**
  if (footerNavButtons && footerNavButtons.length > 0) {
    setActiveNav();
    updateNavBalance();

    // Add click listeners (using data-page)
    footerNavButtons.forEach((item) => {
      // **Use the new variable name**
      item.addEventListener("click", (e) => {
        const pageKey = item.dataset.page;
        if (pageKey) {
          navigateTo(pageKey); // Call the navigation function
        } else {
          console.warn("Nav item clicked without data-page attribute:", item);
        }
      });
    });

    console.log("nav.js (v2) initialized successfully.");
  } else {
    console.warn("Footer navigation items not found on this page.");
  }

  // --- Optional: Update balance display if storage changes ---
  window.addEventListener("storage", (event) => {
    if (event.key === localStorageBalanceKey) {
      console.log("Balance changed in storage, updating nav display.");
      updateNavBalance();
    }
  });
});
