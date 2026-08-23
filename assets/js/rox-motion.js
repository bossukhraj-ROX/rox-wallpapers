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
    { label: "Collections", href: "collections.html" }
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
    logo.width = 459;
    logo.height = 520;
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
      footerBrand.replaceChildren(makeLogo("rox-logo rox-logo-footer"), document.createTextNode("ROX"));
      footerBrand.dataset.roxLogoInstalled = "true";
    });

    const dockHome = document.querySelector('.rox-mobile-dock a[href="index.html"]');
    if (dockHome && !dockHome.dataset.roxLogoInstalled) {
      dockHome.replaceChildren(makeLogo("rox-logo rox-logo-dock"), document.createTextNode("ROX"));
      dockHome.dataset.roxLogoInstalled = "true";
    }
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

  const setupDesktopCollectionShowcase = () => {
    const section = document.querySelector("[data-collection-showcase]");
    const stage = section?.querySelector(".collection-showcase-stage");
    const slides = stage ? [...stage.querySelectorAll(".collection-showcase-slide")] : [];
    const items = section ? [...section.querySelectorAll(".collection-discovery-item")] : [];
    const title = stage?.querySelector("[data-showcase-title]");
    const meta = stage?.querySelector("[data-showcase-meta]");
    const cta = stage?.querySelector("[data-showcase-cta]");
    const progress = stage?.querySelector("[data-showcase-progress]");
    const desktopLayout = window.matchMedia("(min-width: 900px)");
    const showcaseReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!section || !stage || !title || !meta || !cta || !progress || slides.length !== items.length || !slides.length) return;

    let activeIndex = 0;
    let scrollScheduled = false;
    let copyFrame = 0;
    let exitTimer = 0;

    const setActive = (index) => {
      const nextIndex = Math.max(0, Math.min(slides.length - 1, index));
      if (nextIndex === activeIndex && slides[nextIndex].classList.contains("is-showcase-active")) return;

      const previousIndex = activeIndex;
      activeIndex = nextIndex;
      window.clearTimeout(exitTimer);
      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle("is-showcase-active", slideIndex === nextIndex);
        slide.classList.toggle("is-showcase-exiting", slideIndex === previousIndex && previousIndex !== nextIndex);
      });
      items.forEach((item, itemIndex) => item.classList.toggle("is-showcase-active", itemIndex === nextIndex));

      stage.querySelector(".collection-showcase-copy")?.classList.add("is-showcase-copy-changing");
      window.cancelAnimationFrame(copyFrame);
      copyFrame = window.requestAnimationFrame(() => {
        const item = items[nextIndex];
        title.textContent = item.dataset.showcaseTitle || item.textContent.trim();
        meta.textContent = `Live collection · ${String(nextIndex + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
        cta.textContent = item.dataset.showcaseCta || `View ${item.textContent.trim()}`;
        cta.href = item.getAttribute("href") || "#";
        progress.style.width = `${((nextIndex + 1) / slides.length) * 100}%`;
        stage.querySelector(".collection-showcase-copy")?.classList.remove("is-showcase-copy-changing");
      });

      exitTimer = window.setTimeout(() => {
        slides.forEach((slide, slideIndex) => {
          if (slideIndex !== activeIndex) slide.classList.remove("is-showcase-exiting");
        });
      }, 820);
    };

    const updateFromScroll = () => {
      scrollScheduled = false;
      if (!desktopLayout.matches || showcaseReducedMotion.matches) return;
      const sectionTop = section.getBoundingClientRect().top;
      const scrollRange = Math.max(1, section.offsetHeight - stage.offsetHeight);
      const progressValue = Math.max(0, Math.min(1, -sectionTop / scrollRange));
      setActive(Math.round(progressValue * (slides.length - 1)));
    };

    const queueScrollUpdate = () => {
      if (scrollScheduled) return;
      scrollScheduled = true;
      window.requestAnimationFrame(updateFromScroll);
    };

    window.addEventListener("scroll", queueScrollUpdate, { passive: true });
    window.addEventListener("resize", queueScrollUpdate, { passive: true });
    desktopLayout.addEventListener?.("change", queueScrollUpdate);
    showcaseReducedMotion.addEventListener?.("change", queueScrollUpdate);
    updateFromScroll();
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

  const setupPreviewPresentation = () => {
    const previews = [...document.querySelectorAll(".protected-preview-gallery .preview")];
    if (!previews.length) return;

    const previewDesktop = window.matchMedia("(hover: hover) and (pointer: fine)");
    const resetTilt = (preview) => {
      preview.style.setProperty("--rox-preview-tilt-x", "0deg");
      preview.style.setProperty("--rox-preview-tilt-y", "0deg");
    };

    previews.forEach((preview) => {
      resetTilt(preview);
      preview.addEventListener("pointermove", (event) => {
        if (!previewDesktop.matches || reduceMotion.matches || event.pointerType !== "mouse") return;
        const bounds = preview.getBoundingClientRect();
        const normalizedX = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
        const normalizedY = ((event.clientY - bounds.top) / bounds.height) * 2 - 1;
        preview.style.setProperty("--rox-preview-tilt-y", `${(normalizedX * 6).toFixed(2)}deg`);
        preview.style.setProperty("--rox-preview-tilt-x", `${(-normalizedY * 4).toFixed(2)}deg`);
      });
      preview.addEventListener("pointerleave", () => resetTilt(preview));
      preview.addEventListener("pointercancel", () => resetTilt(preview));
    });

    if ("MutationObserver" in window) {
      const observer = new MutationObserver((records) => {
        if (reduceMotion.matches || !mobileLayout.matches) return;
        records.forEach((record) => {
          const preview = record.target;
          if (!(preview instanceof Element) || !preview.classList.contains("is-visible")) return;
          preview.classList.remove("rox-preview-settle");
          window.requestAnimationFrame(() => preview.classList.add("rox-preview-settle"));
        });
      });
      previews.forEach((preview) => observer.observe(preview, { attributes: true, attributeFilter: ["class"] }));
    }
  };

  const setupFaqAccordions = () => {
    const items = [...document.querySelectorAll("details.rox-faq, .faq-list details.faq-item")];
    if (!items.length) return;

    items.forEach((details) => {
      details.classList.add("rox-faq");
      const summary = details.querySelector("summary");
      if (!summary) return;

      const finish = () => {
        details.style.removeProperty("height");
        details.style.removeProperty("overflow");
        details.dataset.roxFaqAnimating = "";
      };

      summary.addEventListener("click", (event) => {
        event.preventDefault();
        if (details.dataset.roxFaqAnimating) return;

        const opening = !details.open;
        if (reduceMotion.matches || typeof details.animate !== "function") {
          details.open = opening;
          return;
        }

        details.dataset.roxFaqAnimating = "true";
        const startHeight = details.getBoundingClientRect().height;
        details.style.overflow = "hidden";

        if (opening) {
          details.open = true;
          const endHeight = details.scrollHeight;
          details.style.height = `${startHeight}px`;
          const animation = details.animate(
            [{ height: `${startHeight}px` }, { height: `${endHeight}px` }],
            { duration: 340, easing: "cubic-bezier(.22, 1, .36, 1)" }
          );
          animation.onfinish = finish;
          animation.oncancel = finish;
          return;
        }

        const endHeight = summary.getBoundingClientRect().height;
        details.style.height = `${startHeight}px`;
        const animation = details.animate(
          [{ height: `${startHeight}px` }, { height: `${endHeight}px` }],
          { duration: 280, easing: "cubic-bezier(.22, 1, .36, 1)" }
        );
        animation.onfinish = () => {
          details.open = false;
          finish();
        };
        animation.oncancel = finish;
      });
    });
  };

  const setupLegalTableOfContents = () => {
    const tocDetails = document.querySelector("[data-legal-toc]");
    const toc = tocDetails?.querySelector(".rox-legal-toc");
    const list = document.querySelector(".policy-list, .legal-grid");
    if (!tocDetails || !toc || !list) return;

    const cards = [...list.querySelectorAll(".policy-card, .term-card")];
    if (!cards.length) return;

    const links = new Map();
    const pageKey = (window.location.pathname.split("/").pop() || "legal").replace(/\.html$/i, "").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    cards.forEach((card, index) => {
      const number = card.querySelector(".section-number, .term-number")?.textContent.trim() || String(index + 1).padStart(2, "0");
      const heading = card.querySelector("h2");
      if (!heading) return;
      if (!card.id) card.id = `${pageKey}-${number}`;

      const link = document.createElement("a");
      link.href = `#${card.id}`;
      link.textContent = `${number} ${heading.textContent.trim()}`;
      link.dataset.roxTocTarget = card.id;
      toc.append(link);
      links.set(card, link);
    });

    const setActive = (card) => {
      if (!links.has(card)) return;
      links.forEach((link, target) => {
        const active = target === card;
        link.classList.toggle("is-current", active);
        if (active) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    };

    const setNearestActive = () => {
      const anchorLine = 132;
      const candidates = cards.filter((card) => card.getBoundingClientRect().bottom > anchorLine);
      const nearest = (candidates.length ? candidates : cards).reduce((closest, card) => {
        if (!closest) return card;
        return Math.abs(card.getBoundingClientRect().top - anchorLine) < Math.abs(closest.getBoundingClientRect().top - anchorLine) ? card : closest;
      }, null);
      setActive(nearest || cards[0]);
    };

    window.roxLegalToc = { setActive: setNearestActive };
    setNearestActive();

    let scrollFrame = 0;
    const queueNearestActive = () => {
      if (scrollFrame) return;
      scrollFrame = window.requestAnimationFrame(() => {
        scrollFrame = 0;
        setNearestActive();
      });
    };
    window.addEventListener("scroll", queueNearestActive, { passive: true });
    window.addEventListener("hashchange", queueNearestActive);

    toc.addEventListener("click", (event) => {
      const link = event.target.closest("a[data-rox-toc-target]");
      if (!link) return;
      if (mobileLayout.matches) tocDetails.open = false;
      queueNearestActive();
    });
  };

  installBrandMarks();
  setupDock();
  setupDesktopCollectionShowcase();
  setupCollectionRail();
  setupPreviewPresentation();
  setupFaqAccordions();
  setupLegalTableOfContents();
})();
