(() => {
  "use strict";

  const body = document.body;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const touchMedia = window.matchMedia("(hover: none), (pointer: coarse)");
  const pageName = window.location.pathname.split("/").pop() || "index.html";
  const supportLinks = [
    { label: "Contact", href: "contact.html" },
    { label: "Privacy", href: "privacy.html" },
    { label: "Refunds", href: "refund.html" },
    { label: "Terms", href: "terms.html" }
  ];
  const dockLinks = [
    { label: "ROX", href: "index.html" },
    { label: "Collections", href: "index.html#collection-world" }
  ];
  const releaseTimers = new WeakMap();
  let activeTarget = null;
  let mobileSupportButton = null;
  let mobileSupportSheet = null;
  let desktopSupportButton = null;
  let desktopSupportMenu = null;
  let supportCloseTimer = null;
  let mobileSupportCloseTimer = null;
  let viewer = null;
  let viewerImage = null;
  let viewerCaption = null;
  let viewerPrevious = null;
  let viewerNext = null;
  let viewerClose = null;
  let viewerItems = [];
  let viewerIndex = 0;
  let viewerOpener = null;
  let swipeStartX = null;

  body.classList.add("rox-next-generation");

  const isCurrentPage = (href) => href === pageName || (pageName === "" && href === "index.html");
  const canAnimateTouch = () => touchMedia.matches && !reducedMotion.matches;
  const clearRelease = (target) => {
    const timer = releaseTimers.get(target);
    if (timer) window.clearTimeout(timer);
    target.classList.remove("rox-touch-release");
  };
  const clearActive = () => {
    if (!activeTarget) return;
    activeTarget.classList.remove("rox-touch-active");
    activeTarget = null;
  };

  const closeDesktopSupport = () => {
    if (!desktopSupportButton || !desktopSupportMenu) return;
    desktopSupportButton.setAttribute("aria-expanded", "false");
    if (desktopSupportMenu.hidden) return;
    desktopSupportMenu.classList.remove("is-open");
    desktopSupportMenu.classList.add("is-closing");
    window.clearTimeout(supportCloseTimer);
    supportCloseTimer = window.setTimeout(() => {
      desktopSupportMenu.hidden = true;
      desktopSupportMenu.classList.remove("is-closing");
    }, reducedMotion.matches ? 0 : 220);
  };

  const openDesktopSupport = () => {
    if (!desktopSupportButton || !desktopSupportMenu) return;
    closeMobileSupport();
    window.clearTimeout(supportCloseTimer);
    desktopSupportMenu.hidden = false;
    desktopSupportMenu.classList.remove("is-closing");
    desktopSupportButton.setAttribute("aria-expanded", "true");
    window.requestAnimationFrame(() => desktopSupportMenu.classList.add("is-open"));
  };

  const closeMobileSupport = (restoreFocus = false) => {
    if (!mobileSupportButton || !mobileSupportSheet || mobileSupportSheet.hidden) return;
    mobileSupportSheet.classList.remove("is-open");
    mobileSupportButton.setAttribute("aria-expanded", "false");
    body.classList.remove("rox-menu-open");
    window.clearTimeout(mobileSupportCloseTimer);
    mobileSupportCloseTimer = window.setTimeout(() => { mobileSupportSheet.hidden = true; }, reducedMotion.matches ? 0 : 440);
    if (restoreFocus) mobileSupportButton.focus();
  };

  const openMobileSupport = () => {
    if (!mobileSupportButton || !mobileSupportSheet) return;
    closeDesktopSupport();
    window.clearTimeout(mobileSupportCloseTimer);
    mobileSupportSheet.hidden = false;
    mobileSupportButton.setAttribute("aria-expanded", "true");
    body.classList.add("rox-menu-open");
    window.requestAnimationFrame(() => {
      mobileSupportSheet.classList.add("is-open");
      mobileSupportSheet.querySelector("a")?.focus();
    });
  };

  const makeLink = ({ label, href }, className = "") => {
    const link = document.createElement("a");
    link.href = href;
    link.textContent = label;
    if (className) link.className = className;
    if (isCurrentPage(href)) link.setAttribute("aria-current", "page");
    return link;
  };

  const setupNavigation = () => {
    const header = document.querySelector(".site-header");
    const nav = header?.querySelector(".nav, .nav-shell");
    if (!nav || nav.dataset.roxNextNavigation === "true") return;
    nav.dataset.roxNextNavigation = "true";
    nav.classList.add("rox-floating-nav");

    const existingHome = nav.querySelector('.brand[href="index.html"]');
    if (existingHome) {
      existingHome.setAttribute("aria-label", "ROX / Home");
      if (isCurrentPage("index.html")) existingHome.setAttribute("aria-current", "page");
    }

    const existingContact = nav.querySelector('a[href="contact.html"]');
    const existingContactItem = existingContact?.closest("li");
    if (existingContactItem) existingContactItem.remove(); else existingContact?.remove();

    const existingCollections = nav.querySelector('a[href="collections.html"]');
    if (existingCollections) existingCollections.href = "index.html#collection-world";

    const supportWrap = document.createElement("div");
    supportWrap.className = "rox-support-wrap";
    desktopSupportButton = document.createElement("button");
    desktopSupportButton.type = "button";
    desktopSupportButton.className = "rox-support-control";
    desktopSupportButton.textContent = "Support";
    desktopSupportButton.setAttribute("aria-expanded", "false");
    desktopSupportButton.setAttribute("aria-controls", "rox-desktop-support-menu");
    desktopSupportMenu = document.createElement("div");
    desktopSupportMenu.id = "rox-desktop-support-menu";
    desktopSupportMenu.className = "rox-support-menu";
    desktopSupportMenu.hidden = true;
    desktopSupportMenu.setAttribute("role", "menu");
    supportLinks.forEach((item) => {
      const link = makeLink(item);
      link.setAttribute("role", "menuitem");
      link.addEventListener("click", closeDesktopSupport);
      desktopSupportMenu.append(link);
    });
    desktopSupportButton.addEventListener("click", (event) => {
      event.stopPropagation();
      if (desktopSupportMenu.hidden || desktopSupportMenu.classList.contains("is-closing")) openDesktopSupport();
      else closeDesktopSupport();
    });
    supportWrap.append(desktopSupportButton, desktopSupportMenu);
    nav.append(supportWrap);

    const dock = document.createElement("nav");
    dock.className = "rox-mobile-dock";
    dock.setAttribute("aria-label", "Mobile navigation");
    dockLinks.forEach((item) => dock.append(makeLink(item)));
    mobileSupportButton = document.createElement("button");
    mobileSupportButton.type = "button";
    mobileSupportButton.textContent = "Support";
    mobileSupportButton.setAttribute("aria-expanded", "false");
    mobileSupportButton.setAttribute("aria-controls", "rox-mobile-support-sheet");
    mobileSupportButton.addEventListener("click", () => {
      if (mobileSupportSheet?.hidden) openMobileSupport(); else closeMobileSupport();
    });
    dock.append(mobileSupportButton);
    body.append(dock);

    mobileSupportSheet = document.createElement("div");
    mobileSupportSheet.id = "rox-mobile-support-sheet";
    mobileSupportSheet.className = "rox-mobile-sheet";
    mobileSupportSheet.hidden = true;
    mobileSupportSheet.setAttribute("role", "dialog");
    mobileSupportSheet.setAttribute("aria-modal", "true");
    mobileSupportSheet.setAttribute("aria-label", "ROX support navigation");
    const sheetPanel = document.createElement("div");
    sheetPanel.className = "rox-mobile-sheet-panel";
    const sheetTitle = document.createElement("p");
    sheetTitle.className = "rox-mobile-sheet-title";
    sheetTitle.textContent = "Support";
    sheetPanel.append(sheetTitle);
    supportLinks.forEach((item) => {
      const link = makeLink(item);
      link.addEventListener("click", closeMobileSupport);
      sheetPanel.append(link);
    });
    mobileSupportSheet.append(sheetPanel);
    mobileSupportSheet.addEventListener("click", (event) => {
      if (event.target === mobileSupportSheet) closeMobileSupport(true);
    });
    body.append(mobileSupportSheet);
  };

  const updateViewer = () => {
    const image = viewerItems[viewerIndex];
    if (!image || !viewerImage || !viewerCaption) return;
    const visibleNumber = String(viewerIndex + 1).padStart(2, "0");
    viewerImage.src = image.currentSrc || image.src;
    viewerImage.alt = image.alt;
    viewerCaption.textContent = `Protected preview ${visibleNumber} of ${String(viewerItems.length).padStart(2, "0")}`;
    const canNavigate = viewerItems.length > 1;
    viewerPrevious.hidden = !canNavigate;
    viewerNext.hidden = !canNavigate;
  };

  const closeViewer = (restoreFocus = true) => {
    if (!viewer || viewer.hidden) return;
    viewer.classList.remove("is-open");
    viewer.classList.add("is-closing");
    body.classList.remove("rox-viewer-open");
    window.setTimeout(() => {
      viewer.hidden = true;
      viewer.classList.remove("is-closing");
      viewerImage.removeAttribute("src");
    }, reducedMotion.matches ? 0 : 180);
    if (restoreFocus && viewerOpener) viewerOpener.focus();
  };

  const moveViewer = (direction) => {
    if (viewerItems.length < 2) return;
    viewerIndex = (viewerIndex + direction + viewerItems.length) % viewerItems.length;
    updateViewer();
  };

  const openViewer = (gallery, preview) => {
    if (!viewer) return;
    viewerItems = Array.from(gallery.querySelectorAll(".preview img"));
    const targetImage = preview.querySelector("img");
    viewerIndex = viewerItems.indexOf(targetImage);
    if (viewerIndex < 0) return;
    viewerOpener = preview;
    updateViewer();
    viewer.hidden = false;
    body.classList.add("rox-viewer-open");
    window.requestAnimationFrame(() => {
      viewer.classList.add("is-open");
      viewerClose.focus();
    });
  };

  const setupPreviewViewer = () => {
    const galleries = Array.from(document.querySelectorAll(".protected-preview-gallery"));
    if (!galleries.length) return;

    viewer = document.createElement("div");
    viewer.className = "rox-preview-viewer";
    viewer.hidden = true;
    viewer.setAttribute("role", "dialog");
    viewer.setAttribute("aria-modal", "true");
    viewer.setAttribute("aria-labelledby", "rox-preview-viewer-caption");
    viewer.innerHTML = '<div class="rox-preview-stage"><button type="button" class="rox-preview-close" aria-label="Close protected preview">×</button><button type="button" class="rox-viewer-control" data-direction="previous" aria-label="Previous protected preview">‹</button><figure><img draggable="false" alt=""><figcaption id="rox-preview-viewer-caption" class="rox-preview-caption"></figcaption></figure><button type="button" class="rox-viewer-control" data-direction="next" aria-label="Next protected preview">›</button></div>';
    viewerClose = viewer.querySelector(".rox-preview-close");
    viewerPrevious = viewer.querySelector('[data-direction="previous"]');
    viewerNext = viewer.querySelector('[data-direction="next"]');
    viewerImage = viewer.querySelector("img");
    viewerCaption = viewer.querySelector("figcaption");
    viewerClose.addEventListener("click", () => closeViewer());
    viewerPrevious.addEventListener("click", () => moveViewer(-1));
    viewerNext.addEventListener("click", () => moveViewer(1));
    viewer.addEventListener("click", (event) => { if (event.target === viewer) closeViewer(); });
    viewer.addEventListener("contextmenu", (event) => event.preventDefault());
    viewer.addEventListener("pointerdown", (event) => { swipeStartX = event.clientX; });
    viewer.addEventListener("pointerup", (event) => {
      if (swipeStartX === null || Math.abs(event.clientX - swipeStartX) < 48) { swipeStartX = null; return; }
      moveViewer(event.clientX < swipeStartX ? 1 : -1);
      swipeStartX = null;
    });
    body.append(viewer);

    galleries.forEach((gallery) => {
      const previews = Array.from(gallery.querySelectorAll(".preview"));
      previews.forEach((preview, index) => {
        preview.setAttribute("tabindex", "0");
        preview.setAttribute("role", "button");
        preview.setAttribute("aria-haspopup", "dialog");
        preview.setAttribute("aria-label", `Open protected preview ${String(index + 1).padStart(2, "0")}`);
        preview.querySelector("img")?.setAttribute("draggable", "false");
      });
      gallery.addEventListener("click", (event) => {
        const preview = event.target instanceof Element ? event.target.closest(".preview") : null;
        if (preview && gallery.contains(preview)) openViewer(gallery, preview);
      });
      gallery.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        const preview = event.target instanceof Element ? event.target.closest(".preview") : null;
        if (!preview || !gallery.contains(preview)) return;
        event.preventDefault();
        openViewer(gallery, preview);
      });
    });
  };

  const setupTouchResponse = () => {
    const interactiveSelector = ".button, .menu-toggle, .site-header .nav-links a, .rox-support-control, .rox-mobile-dock a, .rox-mobile-dock button, .rox-support-menu a, .rox-mobile-sheet a, .rox-viewer-control, .rox-preview-close, .feature-frame, .artwork, .preview, .future-card, .benefit, .info-card, .policy-card, .refund-card, .support-card, .faq-item, .guidance-card, .term-card, .download-panel, .support-panel, .step-card";
    const getInteractiveTarget = (event) => event.target instanceof Element ? event.target.closest(interactiveSelector) : null;

    document.addEventListener("pointerdown", (event) => {
      if (!canAnimateTouch() || event.pointerType === "mouse" || !event.isPrimary) return;
      const target = getInteractiveTarget(event);
      if (!target) return;
      clearActive();
      clearRelease(target);
      activeTarget = target;
      target.classList.add("rox-touch-active");
    }, { passive: true });

    document.addEventListener("pointerup", (event) => {
      if (!canAnimateTouch() || event.pointerType === "mouse" || !event.isPrimary || !activeTarget) return;
      const target = activeTarget;
      clearActive();
      clearRelease(target);
      target.classList.add("rox-touch-release");
      releaseTimers.set(target, window.setTimeout(() => target.classList.remove("rox-touch-release"), 410));
    }, { passive: true });

    document.addEventListener("pointercancel", clearActive, { passive: true });
    touchMedia.addEventListener?.("change", clearActive);
    reducedMotion.addEventListener?.("change", clearActive);
  };

  const setupEntrances = () => {
    const homeInner = document.querySelector(".hero-inner");
    if (homeInner) {
      homeInner.classList.add("rox-home-entrance");
      window.requestAnimationFrame(() => homeInner.classList.add("is-ready"));
      return;
    }
    const firstSection = document.querySelector("main > section");
    if (!firstSection) return;
    firstSection.classList.add("rox-page-entrance");
    window.requestAnimationFrame(() => firstSection.classList.add("is-ready"));
  };

  const setupDockScrollState = () => {
    let lastScrollY = window.scrollY;
    let scheduled = false;
    window.addEventListener("scroll", () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(() => {
        const nextScrollY = window.scrollY;
        const change = nextScrollY - lastScrollY;
        if (nextScrollY > 120 && change > 8) body.classList.add("rox-dock-is-quiet");
        if (change < -4 || nextScrollY < 80) body.classList.remove("rox-dock-is-quiet");
        lastScrollY = nextScrollY;
        scheduled = false;
      });
    }, { passive: true });
  };

  const updateCollectionRoutes = () => {
    document.querySelectorAll('a[href^="collections.html"]').forEach((link) => {
      const hash = link.getAttribute("href")?.split("#")[1];
      link.setAttribute("href", hash ? `index.html#${hash}` : "index.html#collection-world");
    });
  };

  document.addEventListener("click", (event) => {
    if (desktopSupportMenu && !desktopSupportMenu.hidden && !event.target.closest(".rox-support-wrap")) closeDesktopSupport();
  });

  document.addEventListener("keydown", (event) => {
    if (viewer && !viewer.hidden) {
      if (event.key === "Escape") { event.preventDefault(); closeViewer(); }
      if (event.key === "ArrowLeft") { event.preventDefault(); moveViewer(-1); }
      if (event.key === "ArrowRight") { event.preventDefault(); moveViewer(1); }
      return;
    }
    if (event.key === "Escape") {
      closeDesktopSupport();
      closeMobileSupport(true);
    }
  });

  updateCollectionRoutes();
  setupNavigation();
  setupPreviewViewer();
  setupTouchResponse();
  setupEntrances();
  setupDockScrollState();
})();

/* Final ROX mobile UX refinement: a native collection rail, compact dock and shared brand asset. */
(() => {
  "use strict";

  const body = document.body;
  const pageName = window.location.pathname.split("/").pop() || "index.html";
  const mobileLayout = window.matchMedia("(max-width: 720px)");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const logoSource = "assets/images/brand/rox-logo.png";
  const routeIndex = ["contact.html", "support.html", "privacy.html", "refund.html", "terms.html"].includes(pageName) ? 2 : pageName === "collections.html" ? 1 : 0;

  const makeLogo = (className) => {
    const logo = document.createElement("img");
    logo.className = className;
    logo.src = logoSource;
    logo.alt = "";
    logo.width = 1233;
    logo.height = 1275;
    logo.decoding = "async";
    logo.setAttribute("aria-hidden", "true");
    return logo;
  };

  const installBrandMarks = () => {
    document.querySelectorAll('.brand[href="index.html"]').forEach((brand) => {
      if (brand.dataset.roxLogoInstalled) return;
      brand.replaceChildren(makeLogo("rox-logo rox-logo-nav"));
      brand.dataset.roxLogoInstalled = "true";
    });

    document.querySelectorAll(".site-footer .footer-brand").forEach((footerBrand) => {
      if (footerBrand.dataset.roxLogoInstalled || footerBrand.textContent.trim() !== "ROX") return;
      const wordmark = document.createElement("span");
      wordmark.className = "rox-footer-name";
      wordmark.textContent = "ROX";
      footerBrand.replaceChildren(makeLogo("rox-logo rox-logo-footer"), wordmark);
      footerBrand.dataset.roxLogoInstalled = "true";
    });

    const dockHome = document.querySelector('.rox-mobile-dock a[href="index.html"]');
    if (dockHome && !dockHome.dataset.roxLogoInstalled) {
      dockHome.replaceChildren(makeLogo("rox-logo rox-logo-dock"), document.createTextNode("ROX"));
      dockHome.dataset.roxLogoInstalled = "true";
    }
  };

  const installFooterSocials = () => {
    const socialProfiles = [
      {
        label: "Instagram",
        href: "https://www.instagram.com/rox_premium_wallpapers",
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true" focusable="false"><rect x="3.5" y="3.5" width="17" height="17" rx="5"></rect><circle cx="12" cy="12" r="4"></circle><circle cx="17.4" cy="6.8" r="1" fill="currentColor" stroke="none"></circle></svg>'
      },
      {
        label: "TikTok",
        href: "https://www.tiktok.com/@rox_premium_wallpapers",
        icon: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M16.6 3c.33 2.3 1.6 3.75 3.9 4.1v3.22c-1.47.14-2.77-.33-3.87-1.09v6.21c0 4.09-4.44 6.64-7.96 4.3-2.21-1.47-2.79-4.55-1.35-6.87 1.38-2.23 4.1-2.83 6.06-1.63v3.4c-.87-.38-1.83-.24-2.42.39-.81.85-.54 2.48.54 2.97 1.13.52 2.53-.3 2.53-1.69V3h2.51Z"></path></svg>'
      },
      {
        label: "YouTube",
        href: "https://youtube.com/@rox_premium_wallpapers",
        icon: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><rect x="2" y="5" width="20" height="14" rx="4" fill="#ff0033"></rect><path d="m10 8.8 5.5 3.2-5.5 3.2V8.8Z" fill="#fff"></path></svg>'
      }
    ];

    document.querySelectorAll(".site-footer .footer-brand").forEach((footerBrand) => {
      const footer = footerBrand.closest(".site-footer");
      if (!footer || footer.querySelector(".rox-footer-socials")) return;

      const socials = document.createElement("nav");
      socials.className = "rox-footer-socials";
      socials.setAttribute("aria-label", "ROX social media");

      socialProfiles.forEach(({ label, href, icon }) => {
        const link = document.createElement("a");
        link.href = href;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.setAttribute("aria-label", `Follow ROX on ${label}`);
        link.innerHTML = icon;
        socials.append(link);
      });

      footerBrand.insertAdjacentElement("afterend", socials);
    });
  };

  const installFooterPresentation = () => {
    document.querySelectorAll(".site-footer").forEach((footer) => {
      footer.classList.add("rox-atmospheric-footer");

      let panel = footer.querySelector(":scope > .rox-footer-panel");
      if (!panel) {
        panel = document.createElement("div");
        panel.className = "rox-footer-panel";
        Array.from(footer.childNodes).forEach((node) => panel.append(node));
        footer.append(panel);
      }

      const footerBrand = panel.querySelector(".footer-brand");
      if (footerBrand && !panel.querySelector(".rox-footer-signature")) {
        const signature = document.createElement("div");
        signature.className = "rox-footer-signature";

        const premium = document.createElement("p");
        premium.className = "rox-footer-premium";
        premium.textContent = "Premium Wallpapers";

        const tagline = document.createElement("p");
        tagline.className = "rox-footer-tagline";
        tagline.textContent = "Designed for the screen in front of you.";

        signature.append(premium, tagline);
        footerBrand.insertAdjacentElement("afterend", signature);
      }
    });
  };

  const setupDock = () => {
    const dock = document.querySelector(".rox-mobile-dock");
    const supportButton = dock?.querySelector("button");
    if (!dock || !supportButton) return;

    const dockItems = Array.from(dock.querySelectorAll("a, button"));
    let contextualIndex = routeIndex;
    const setActive = (index, shouldUpdateContext = false) => {
      if (shouldUpdateContext) contextualIndex = index;
      dock.dataset.roxActiveIndex = String(Math.max(0, Math.min(2, index)));
    };
    const syncSupportState = () => {
      window.requestAnimationFrame(() => {
        setActive(supportButton.getAttribute("aria-expanded") === "true" ? 2 : contextualIndex);
      });
    };

    setActive(routeIndex);
    dockItems.forEach((item, index) => {
      if (item.tagName === "A") item.addEventListener("click", () => setActive(index, true));
    });
    supportButton.addEventListener("click", () => {
      body.classList.remove("rox-dock-is-compact");
      syncSupportState();
    });
    dock.addEventListener("pointerdown", () => body.classList.remove("rox-dock-is-compact"), { passive: true });
    document.addEventListener("click", syncSupportState);
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") syncSupportState(); });

    if (pageName === "index.html" && "IntersectionObserver" in window) {
      const home = document.querySelector(".hero");
      const firstCollection = document.querySelector("#glass-city");
      if (home && firstCollection) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) setActive(entry.target === firstCollection ? 1 : 0, true);
          });
        }, { rootMargin: "-32% 0px -48% 0px", threshold: .01 });
        observer.observe(home);
        observer.observe(firstCollection);
      }
    }

    let lastScrollY = window.scrollY;
    let downwardDistance = 0;
    let upwardDistance = 0;
    let scheduled = false;
    window.addEventListener("scroll", () => {
      if (!mobileLayout.matches || body.classList.contains("rox-menu-open") || scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const delta = currentY - lastScrollY;
        if (delta > 2) { downwardDistance += delta; upwardDistance = 0; }
        if (delta < -2) { upwardDistance += Math.abs(delta); downwardDistance = 0; }
        if (currentY > 132 && downwardDistance >= 28) {
          body.classList.add("rox-dock-is-compact");
          downwardDistance = 0;
        }
        if (currentY < 82 || upwardDistance >= 16) {
          body.classList.remove("rox-dock-is-compact");
          upwardDistance = 0;
        }
        lastScrollY = currentY;
        scheduled = false;
      });
    }, { passive: true });
  };

  const setupCollectionRail = () => {
    const wrapper = document.querySelector("[data-collection-rail]");
    const track = wrapper?.querySelector(".collection-discovery-track");
    const previous = wrapper?.querySelector("[data-collection-previous]");
    const next = wrapper?.querySelector("[data-collection-next]");
    if (!wrapper || !track || !previous || !next) return;

    let scheduled = false;
    const updateControls = () => {
      scheduled = false;
      const canScroll = mobileLayout.matches && track.scrollWidth - track.clientWidth > 4;
      const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
      const atStart = track.scrollLeft <= 2;
      const atEnd = track.scrollLeft >= maxScroll - 2;
      wrapper.classList.toggle("has-scrollable-collections", canScroll);
      wrapper.classList.toggle("is-at-collection-end", atEnd);
      previous.hidden = !canScroll || atStart;
      previous.disabled = !canScroll || atStart;
      next.hidden = !canScroll || atEnd;
      next.disabled = !canScroll || atEnd;
    };
    const queueUpdate = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(updateControls);
    };
    const move = (direction) => {
      const item = track.querySelector(".collection-discovery-item");
      if (!item) return;
      const styles = window.getComputedStyle(track);
      const gap = Number.parseFloat(styles.columnGap || styles.gap) || 0;
      track.scrollBy({ left: direction * (item.getBoundingClientRect().width + gap), behavior: reduceMotion.matches ? "auto" : "smooth" });
    };

    previous.addEventListener("click", () => move(-1));
    next.addEventListener("click", () => move(1));
    track.addEventListener("scroll", queueUpdate, { passive: true });
    window.addEventListener("resize", queueUpdate, { passive: true });
    mobileLayout.addEventListener?.("change", queueUpdate);
    updateControls();
  };

  installBrandMarks();
  installFooterSocials();
  installFooterPresentation();
  setupDock();
  setupCollectionRail();
})();

/* Long-form collection staging changes document height after first paint.  Re-align
   direct collection URLs once images and layout have settled, preserving old links. */
(() => {
  "use strict";

  const knownAnchors = new Set(["#glass-city", "#luminar", "#crystal-district", "#elevation", "#obsidian"]);
  const alignAnchor = () => {
    if (!knownAnchors.has(window.location.hash)) return;
    const target = document.querySelector(window.location.hash);
    if (!target) return;
    window.requestAnimationFrame(() => target.scrollIntoView({ block: "start", behavior: "auto" }));
  };

  const alignInitialAnchor = () => {
    alignAnchor();
    window.setTimeout(alignAnchor, 120);
    window.setTimeout(alignAnchor, 620);
  };
  if (document.readyState === "complete") alignInitialAnchor();
  else window.addEventListener("load", alignInitialAnchor, { once: true });
  window.addEventListener("hashchange", alignAnchor);
})();

/* A light, scroll-led collection journey for the ROX home page.  It deliberately
   uses the existing five collection links rather than creating a separate carousel. */
(() => {
  "use strict";

  const showcase = document.querySelector("[data-rox-places-showcase]");
  const stage = showcase?.querySelector(".rox-places-stage");
  const items = showcase ? Array.from(showcase.querySelectorAll(".collection-discovery-item")) : [];
  const controls = showcase ? Array.from(showcase.querySelectorAll("[data-rox-place]")) : [];
  const desktop = window.matchMedia("(min-width: 901px)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (!showcase || !stage || items.length !== 5 || controls.length !== 5) return;

  let frame = 0;
  const clearPresentation = () => {
    showcase.removeAttribute("data-rox-active-place");
    showcase.classList.remove("is-rox-place-pinned", "is-rox-place-complete");
    showcase.style.removeProperty("--rox-place-progress");
    items.forEach((item) => {
      item.classList.remove("is-rox-place-active");
      ["--rox-place-opacity", "--rox-place-y", "--rox-place-z", "--rox-place-rotate", "--rox-place-scale"].forEach((property) => item.style.removeProperty(property));
    });
    controls.forEach((control) => control.removeAttribute("aria-current"));
  };

  const applyPresentation = () => {
    frame = 0;
    if (!desktop.matches || reducedMotion.matches) {
      clearPresentation();
      return;
    }

    const range = Math.max(1, showcase.offsetHeight - stage.clientHeight);
    const start = showcase.offsetTop;
    const end = start + range;
    const progress = Math.max(0, Math.min(1, (window.scrollY - start) / range));
    showcase.classList.toggle("is-rox-place-pinned", window.scrollY > start && window.scrollY < end);
    showcase.classList.toggle("is-rox-place-complete", window.scrollY >= end);
    const position = progress * (items.length - 1);
    const active = Math.round(position);
    showcase.dataset.roxActivePlace = String(active);
    showcase.style.setProperty("--rox-place-progress", progress.toFixed(3));

    items.forEach((item, index) => {
      const offset = index - position;
      const proximity = Math.max(0, 1 - Math.abs(offset));
      const depth = Math.min(1, Math.abs(offset));
      item.classList.toggle("is-rox-place-active", index === active);
      item.style.setProperty("--rox-place-opacity", (0.28 + proximity * 0.72).toFixed(3));
      item.style.setProperty("--rox-place-y", `${Math.round(-proximity * 28 + depth * 20)}px`);
      item.style.setProperty("--rox-place-z", `${Math.round(proximity * 60 - depth * 45)}px`);
      item.style.setProperty("--rox-place-rotate", `${(offset * -5.5).toFixed(2)}deg`);
      item.style.setProperty("--rox-place-scale", (0.9 + proximity * 0.15).toFixed(3));
    });
    controls.forEach((control, index) => {
      if (index === active) control.setAttribute("aria-current", "step");
      else control.removeAttribute("aria-current");
    });
  };

  const queuePresentation = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(applyPresentation);
  };

  controls.forEach((control) => {
    control.addEventListener("click", () => {
      const index = Number.parseInt(control.dataset.roxPlace || "0", 10);
      const range = Math.max(1, showcase.offsetHeight - stage.clientHeight);
      const target = showcase.offsetTop + range * (index / (items.length - 1));
      window.scrollTo({ top: target, behavior: reducedMotion.matches ? "auto" : "smooth" });
    });
  });

  window.addEventListener("scroll", queuePresentation, { passive: true });
  window.addEventListener("resize", queuePresentation, { passive: true });
  desktop.addEventListener?.("change", queuePresentation);
  reducedMotion.addEventListener?.("change", queuePresentation);
  queuePresentation();
})();

/* ROX editorial pacing: lightweight scene state and a small scroll-settle for the home showcase. */
(() => {
  "use strict";

  const body = document.body;
  const isHome = body.classList.contains("rox-editorial-home");
  const isCatalogue = body.classList.contains("rox-editorial-catalogue");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (!isHome && !isCatalogue) return;

  const scenes = Array.from(document.querySelectorAll("main section[id^='glass-city'], main section[id^='luminar'], main section[id^='crystal-district'], main section[id^='elevation'], main section[id^='obsidian']"));
  if ("IntersectionObserver" in window && scenes.length) {
    const sceneObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.target.classList.toggle("rox-scene-inview", entry.isIntersecting));
    }, { rootMargin: "-26% 0px -38% 0px", threshold: .01 });
    scenes.forEach((scene) => sceneObserver.observe(scene));
  }

  if (!isHome || reduceMotion.matches) return;

  const rail = document.querySelector(".collection-discovery");
  if (!rail) return;

  let framePending = false;
  const updateRailSettle = () => {
    framePending = false;
    const progress = Math.max(0, Math.min(1, window.scrollY / Math.max(window.innerHeight * .82, 1)));
    rail.style.setProperty("--rox-editorial-rail-settle", progress.toFixed(3));
  };
  const queueRailSettle = () => {
    if (framePending) return;
    framePending = true;
    window.requestAnimationFrame(updateRailSettle);
  };

  window.addEventListener("scroll", queueRailSettle, { passive: true });
  window.addEventListener("resize", queueRailSettle, { passive: true });
  reduceMotion.addEventListener?.("change", () => {
    if (reduceMotion.matches) rail.style.removeProperty("--rox-editorial-rail-settle");
    else queueRailSettle();
  });
  updateRailSettle();
})();
