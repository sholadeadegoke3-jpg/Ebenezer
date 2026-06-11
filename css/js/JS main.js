/**
 * ============================================================
 * BLOGR LANDING PAGE — MAIN JAVASCRIPT
 * ============================================================
 *
 * Modules:
 * 1.  Utility helpers
 * 2.  Navigation — desktop dropdown
 * 3.  Navigation — mobile menu
 * 4.  Navigation — mobile dropdowns
 * 5.  Scroll-reveal animations
 * 6.  Header — scroll behavior
 * 7.  Keyboard navigation (accessibility)
 * 8.  Init
 * ============================================================
 */

"use strict";

/* ============================================================
   1. UTILITY HELPERS
   ============================================================ */

/**
 * Shorthand querySelector
 * @param {string} selector
 * @param {Element} [parent=document]
 * @returns {Element|null}
 */
const $ = (selector, parent = document) => parent.querySelector(selector);

/**
 * Shorthand querySelectorAll → returns Array
 * @param {string} selector
 * @param {Element} [parent=document]
 * @returns {Element[]}
 */
const $$ = (selector, parent = document) =>
  Array.from(parent.querySelectorAll(selector));

/**
 * Add/remove/toggle a class (shorthand)
 * @param {Element} el
 * @param {string} action  'add' | 'remove' | 'toggle'
 * @param {...string} classes
 */
const cls = (el, action, ...classes) => el.classList[action](...classes);

/**
 * Debounce — limits how often a function fires
 * @param {Function} fn
 * @param {number} delay  milliseconds
 * @returns {Function}
 */
const debounce = (fn, delay = 200) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

/* ============================================================
   2. NAVIGATION — DESKTOP DROPDOWNS
   ============================================================ */

/**
 * Manages the desktop navigation dropdown menus.
 * Each dropdown toggles on button click and closes
 * when clicking outside or pressing Escape.
 */
const DesktopNav = (() => {
  // State
  let activeItem = null;

  /**
   * Open a specific dropdown item
   * @param {Element} item — .nav__item--dropdown element
   */
  const open = (item) => {
    if (activeItem && activeItem !== item) {
      close(activeItem);
    }

    const btn = $(".nav__dropdown-btn", item);
    cls(item, "add", "is-open");
    btn.setAttribute("aria-expanded", "true");
    activeItem = item;
  };

  /**
   * Close a specific dropdown item
   * @param {Element} item
   */
  const close = (item) => {
    const btn = $(".nav__dropdown-btn", item);
    cls(item, "remove", "is-open");
    btn.setAttribute("aria-expanded", "false");
    if (activeItem === item) activeItem = null;
  };

  /**
   * Close all dropdowns
   */
  const closeAll = () => {
    $$(".nav__item--dropdown.is-open").forEach(close);
    activeItem = null;
  };

  /**
   * Toggle a dropdown
   * @param {Element} item
   */
  const toggle = (item) => {
    cls(item, "contains", "is-open") ? close(item) : open(item);
  };

  /**
   * Initialize desktop dropdown event listeners
   */
  const init = () => {
    const dropdownItems = $$(".nav__item--dropdown");

    dropdownItems.forEach((item) => {
      const btn = $(".nav__dropdown-btn", item);

      // Click to toggle
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggle(item);
      });

      // Hover intent — open on mouseenter
      item.addEventListener("mouseenter", () => open(item));
      item.addEventListener("mouseleave", () => close(item));
    });

    // Close on outside click
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".nav__item--dropdown")) {
        closeAll();
      }
    });

    // Close on Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeAll();
    });
  };

  return { init, closeAll };
})();

/* ============================================================
   3. NAVIGATION — MOBILE MENU
   ============================================================ */

/**
 * Manages the mobile navigation menu (hamburger toggle).
 * Handles opening, closing, focus trap, and body scroll lock.
 */
const MobileMenu = (() => {
  // References
  const hamburger = $("#hamburger");
  const mobileMenu = $("#mobile-menu");

  // State
  let isOpen = false;
  let previouslyFocused = null;

  /**
   * Lock/unlock body scroll
   * @param {boolean} lock
   */
  const setBodyScroll = (lock) => {
    document.body.style.overflow = lock ? "hidden" : "";
  };

  /**
   * Open the mobile menu
   */
  const open = () => {
    if (isOpen) return;

    isOpen = true;
    previouslyFocused = document.activeElement;

    // Show menu
    mobileMenu.removeAttribute("hidden");
    cls(mobileMenu, "remove", "is-hidden");

    // Update ARIA
    hamburger.setAttribute("aria-expanded", "true");
    cls(hamburger, "add", "is-open");

    // Small delay so CSS transition kicks in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        cls(mobileMenu, "add", "is-visible");
      });
    });

    setBodyScroll(true);

    // Move focus to first focusable item in menu
    const firstFocusable = $("a, button:not([disabled])", mobileMenu);
    if (firstFocusable) {
      setTimeout(() => firstFocusable.focus(), 50);
    }
  };

  /**
   * Close the mobile menu
   */
  const close = () => {
    if (!isOpen) return;

    isOpen = false;

    cls(mobileMenu, "remove", "is-visible");
    hamburger.setAttribute("aria-expanded", "false");
    cls(hamburger, "remove", "is-open");

    setBodyScroll(false);

    // Hide after transition completes
    const handleTransitionEnd = () => {
      mobileMenu.setAttribute("hidden", "");
      cls(mobileMenu, "add", "is-hidden");
      mobileMenu.removeEventListener("transitionend", handleTransitionEnd);
    };

    mobileMenu.addEventListener("transitionend", handleTransitionEnd);

    // Return focus
    if (previouslyFocused) {
      previouslyFocused.focus();
      previouslyFocused = null;
    }
  };

  /**
   * Toggle mobile menu
   */
  const toggle = () => (isOpen ? close() : open());

  /**
   * Trap focus within the mobile menu
   * @param {KeyboardEvent} e
   */
  const trapFocus = (e) => {
    if (!isOpen || e.key !== "Tab") return;

    const focusableElements = $$(
      'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])',
      mobileMenu
    );

    const firstEl = focusableElements[0];
    const lastEl = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      // Shift+Tab: wrap from first to last
      if (document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      }
    } else {
      // Tab: wrap from last to first
      if (document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    }
  };

  /**
   * Initialize mobile menu
   */
  const init = () => {
    if (!hamburger || !mobileMenu) return;

    // Initially hidden
    mobileMenu.setAttribute("hidden", "");
    cls(mobileMenu, "add", "is-hidden");

    // Toggle on hamburger click
    hamburger.addEventListener("click", toggle);

    // Close on Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isOpen) close();
    });

    // Focus trap
    document.addEventListener("keydown", trapFocus);

    // Close when clicking outside
    document.addEventListener("click", (e) => {
      if (
        isOpen &&
        !mobileMenu.contains(e.target) &&
        !hamburger.contains(e.target)
      ) {
        close();
      }
    });

    // Close if resized to desktop
    window.addEventListener(
      "resize",
      debounce(() => {
        if (window.innerWidth > 1024 && isOpen) {
          close();
        }
      }, 150)
    );
  };

  return { init, close };
})();

/* ============================================================
   4. NAVIGATION — MOBILE DROPDOWNS
   ============================================================ */

/**
 * Manages accordion-style dropdowns inside the mobile menu.
 */
const MobileDropdowns = (() => {
  /**
   * Toggle a single mobile dropdown
   * @param {Element} item — .mobile-menu__item--dropdown element
   */
  const toggle = (item) => {
    const btn = $(".mobile-menu__dropdown-btn", item);
    const dropdown = $(".mobile-menu__dropdown", item);
    const isExpanded = btn.getAttribute("aria-expanded") === "true";

    // Close all other open dropdowns first
    $$(".mobile-menu__item--dropdown.is-open").forEach((openItem) => {
      if (openItem !== item) {
        const openBtn = $(".mobile-menu__dropdown-btn", openItem);
        const openDropdown = $(".mobile-menu__dropdown", openItem);
        openBtn.setAttribute("aria-expanded", "false");
        openDropdown.setAttribute("hidden", "");
        cls(openItem, "remove", "is-open");
      }
    });

    // Toggle this one
    if (isExpanded) {
      btn.setAttribute("aria-expanded", "false");
      dropdown.setAttribute("hidden", "");
      cls(item, "remove", "is-open");
    } else {
      btn.setAttribute("aria-expanded", "true");
      dropdown.removeAttribute("hidden");
      cls(item, "add", "is-open");
    }
  };

  /**
   * Initialize mobile dropdowns
   */
  const init = () => {
    const mobileDropdownItems = $$(".mobile-menu__item--dropdown");

    mobileDropdownItems.forEach((item) => {
      const btn = $(".mobile-menu__dropdown-btn", item);
      btn.addEventListener("click", () => toggle(item));
    });
  };

  return { init };
})();

/* ============================================================
   5. SCROLL-REVEAL ANIMATIONS
   ============================================================ */

/**
 * Uses IntersectionObserver to animate elements into view
 * as the user scrolls down the page.
 */
const ScrollReveal = (() => {
  const THRESHOLD = 0.15; // % of element visible before triggering
  const OBSERVED_CLASS = "animate-on-scroll";
  const VISIBLE_CLASS = "is-visible";

  let observer = null;

  /**
   * Callback fired when observed elements intersect viewport
   * @param {IntersectionObserverEntry[]} entries
   */
  const onIntersect = (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        cls(entry.target, "add", VISIBLE_CLASS);
        // Stop observing once visible (no repeat animation)
        observer.unobserve(entry.target);
      }
    });
  };

  /**
   * Mark elements for animation
   */
  const markElements = () => {
    // Sections to animate
    const selectors = [
      ".section__title",
      ".feature",
      ".infra__text",
      ".footer__col",
      ".footer__brand",
    ];

    selectors.forEach((selector) => {
      $$(selector).forEach((el) => {
        cls(el, "add", OBSERVED_CLASS);
      });
    });
  };

  /**
   * Initialize scroll reveal
   */
  const init = () => {
    // Skip if reduced motion preferred
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Skip if IntersectionObserver not supported
    if (!("IntersectionObserver" in window)) {
      // Fallback: make all elements visible
      $$(`.${OBSERVED_CLASS}`).forEach((el) => cls(el, "add", VISIBLE_CLASS));
      return;
    }

    markElements();

    observer = new IntersectionObserver(onIntersect, {
      threshold: THRESHOLD,
      rootMargin: "0px 0px -50px 0px",
    });

    $$(`.${OBSERVED_CLASS}`).forEach((el) => observer.observe(el));
  };

  return { init };
})();

/* ============================================================
   6. HEADER — SCROLL BEHAVIOR
   ============================================================ */

/**
 * Adds a class to the header when the user scrolls past
 * a threshold, enabling background color changes or shadow.
 */
const HeaderScroll = (() => {
  const SCROLL_THRESHOLD = 80;
  const SCROLLED_CLASS = "header--scrolled";

  let header = null;
  let ticking = false;

  const update = () => {
    const scrolled = window.scrollY > SCROLL_THRESHOLD;
    cls(header, scrolled ? "add" : "remove", SCROLLED_CLASS);
    ticking = false;
  };

  const onScroll = () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  };

  const init = () => {
    header = $("#header");
    if (!header) return;
    window.addEventListener("scroll", onScroll, { passive: true });
    update(); // Run on init in case page loads mid-scroll
  };

  return { init };
})();

/* ============================================================
   7. SMOOTH SCROLLING FOR ANCHOR LINKS
   ============================================================ */

/**
 * Smooth scroll behavior for internal anchor links.
 * Respects reduced-motion preference.
 */
const SmoothScroll = (() => {
  const init = () => {
    // Skip if reduced motion preferred
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    document.addEventListener("click", (e) => {
      const anchor = e.target.closest('a[href^="#"]');
      if (!anchor) return;

      const targetId = anchor.getAttribute("href").slice(1);
      if (!targetId) return;

      const target = document.getElementById(targetId);
      if (!target) return;

      e.preventDefault();

      target.scrollIntoView({ behavior: "smooth", block: "start" });

      // Update URL without jumping
      history.pushState(null, "", `#${targetId}`);

      // Move focus to target for accessibility
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    });
  };

  return { init };
})();

/* ============================================================
   8. INIT — Run everything on DOM ready
   ============================================================ */

/**
 * Main initialization function.
 * Runs all modules after the DOM is fully parsed.
 */
const App = {
  init() {
    try {
      DesktopNav.init();
      MobileMenu.init();
      MobileDropdowns.init();
      ScrollReveal.init();
      HeaderScroll.init();
      SmoothScroll.init();

      console.log("✅ Blogr app initialized successfully.");
    } catch (error) {
      console.error("❌ App initialization error:", error);
    }
  },
};

// Boot when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => App.init());
} else {
  App.init();
}