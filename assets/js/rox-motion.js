(() => {
  "use strict";

  const body = document.body;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const touchMedia = window.matchMedia("(hover: none), (pointer: coarse)");
  const pageName = window.location.pathname.split("/").pop() || "index.html";
  const utilityLinks = [
    { label: "Support", href: "support.html" },
    { label: "Privacy", href: "privacy.html" },
    { label: "Refund", href: "refund.html" },
    { label: "Terms", href: "terms.html" }
  ];
  const dockLinks = [
    { label: "Home", href: "index.html" },
    { label: "Collections", href: "collections.html" },
    { label: "Contact", href: "contact.html" }
  ];
  const releaseTimers = new WeakMap();
  let activeTarget = null;
  let mobileMoreButton = null;
  let mobileSheet = null;
  let desktopMoreButton = null;
  let desktopMoreMenu = null;
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

  const closeDesktopMore = () => {
    if (!desktopMoreButton || !desktopMoreMenu) return;
    desktopMoreButton.setAttribute("aria-expanded", "false");
    desktopMoreMenu.hidden = true;
  };

  const closeMobileMore = (restoreFocus = false) => {
    if (!mobileMoreButton || !mobileSheet || mobileSheet.hidden) return;
    mobileSheet.classList.remove("is-open");
    mobileMoreButton.setAttribute("aria-expanded", "false");
    body.classList.remove("rox-menu-open");
    window.setTimeout(() => { mobileSheet.hidden = true; }, reducedMotion.matches ? 0 : 180);
    if (restoreFocus) mobileMoreButton.focus();
  };

  const openMobileMore = () => {
    if (!mobileMoreButton || !mobileSheet) return;
    closeDesktopMore();
    mobileSheet.hidden = false;
    mobileMoreButton.setAttribute("aria-expanded", "true");
    body.classList.add("rox-menu-open");
    window.requestAnimationFrame(() => {
      mobileSheet.classList.add("is-open");
      mobileSheet.querySelector("a")?.focus();
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

    const moreWrap = document.createElement("div");
    moreWrap.className = "rox-more-wrap";
    desktopMoreButton = document.createElement("button");
    desktopMoreButton.type = "button";
    desktopMoreButton.className = "rox-more-control";
    desktopMoreButton.textContent = "More";
    desktopMoreButton.setAttribute("aria-expanded", "false");
    desktopMoreButton.setAttribute("aria-controls", "rox-desktop-more-menu");
    desktopMoreMenu = document.createElement("div");
    desktopMoreMenu.id = "rox-desktop-more-menu";
    desktopMoreMenu.className = "rox-more-menu";
    desktopMoreMenu.hidden = true;
    desktopMoreMenu.setAttribute("role", "menu");
    utilityLinks.forEach((item) => {
      const link = makeLink(item);
      link.setAttribute("role", "menuitem");
      desktopMoreMenu.append(link);
    });
    desktopMoreButton.addEventListener("click", (event) => {
      event.stopPropagation();
      const shouldOpen = desktopMoreMenu.hidden;
      closeMobileMore();
      desktopMoreMenu.hidden = !shouldOpen;
      desktopMoreButton.setAttribute("aria-expanded", String(shouldOpen));
    });
    moreWrap.append(desktopMoreButton, desktopMoreMenu);
    nav.append(moreWrap);

    const dock = document.createElement("nav");
    dock.className = "rox-mobile-dock";
    dock.setAttribute("aria-label", "Mobile navigation");
    dockLinks.forEach((item) => dock.append(makeLink(item)));
    mobileMoreButton = document.createElement("button");
    mobileMoreButton.type = "button";
    mobileMoreButton.textContent = "More";
    mobileMoreButton.setAttribute("aria-expanded", "false");
    mobileMoreButton.setAttribute("aria-controls", "rox-mobile-more-sheet");
    mobileMoreButton.addEventListener("click", () => {
      if (mobileSheet?.hidden) openMobileMore(); else closeMobileMore();
    });
    dock.append(mobileMoreButton);
    body.append(dock);

    mobileSheet = document.createElement("div");
    mobileSheet.id = "rox-mobile-more-sheet";
    mobileSheet.className = "rox-mobile-sheet";
    mobileSheet.hidden = true;
    mobileSheet.setAttribute("role", "dialog");
    mobileSheet.setAttribute("aria-modal", "true");
    mobileSheet.setAttribute("aria-label", "More ROX pages");
    const sheetPanel = document.createElement("div");
    sheetPanel.className = "rox-mobile-sheet-panel";
    const sheetTitle = document.createElement("p");
    sheetTitle.className = "rox-mobile-sheet-title";
    sheetTitle.textContent = "More from ROX";
    sheetPanel.append(sheetTitle);
    utilityLinks.forEach((item) => sheetPanel.append(makeLink(item)));
    mobileSheet.append(sheetPanel);
    mobileSheet.addEventListener("click", (event) => {
      if (event.target === mobileSheet) closeMobileMore(true);
    });
    body.append(mobileSheet);
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
    const interactiveSelector = ".button, .menu-toggle, .site-header .nav-links a, .rox-more-control, .rox-mobile-dock a, .rox-mobile-dock button, .rox-more-menu a, .rox-mobile-sheet a, .rox-viewer-control, .rox-preview-close, .feature-frame, .artwork, .preview, .future-card, .benefit, .info-card, .policy-card, .refund-card, .support-card, .faq-item, .guidance-card, .term-card, .download-panel, .support-panel, .step-card";
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

  document.addEventListener("click", (event) => {
    if (desktopMoreMenu && !desktopMoreMenu.hidden && !event.target.closest(".rox-more-wrap")) closeDesktopMore();
  });

  document.addEventListener("keydown", (event) => {
    if (viewer && !viewer.hidden) {
      if (event.key === "Escape") { event.preventDefault(); closeViewer(); }
      if (event.key === "ArrowLeft") { event.preventDefault(); moveViewer(-1); }
      if (event.key === "ArrowRight") { event.preventDefault(); moveViewer(1); }
      return;
    }
    if (event.key === "Escape") {
      closeDesktopMore();
      closeMobileMore(true);
    }
  });

  setupNavigation();
  setupPreviewViewer();
  setupTouchResponse();
  setupEntrances();
  setupDockScrollState();
})();
