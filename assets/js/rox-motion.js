(() => {
  "use strict";

  const touchMedia = window.matchMedia("(hover: none), (pointer: coarse)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const interactiveSelector = ".button, .menu-toggle, .site-header .nav-links a, .feature-frame, .artwork, .preview, .future-card, .benefit, .info-card, .policy-card, .refund-card, .support-card, .faq-item, .guidance-card, .term-card, .download-panel, .support-panel, .step-card";
  const releaseTimers = new WeakMap();
  let activeTarget = null;

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

  const getInteractiveTarget = (event) => {
    if (!(event.target instanceof Element)) return null;
    return event.target.closest(interactiveSelector);
  };

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
    releaseTimers.set(target, window.setTimeout(() => target.classList.remove("rox-touch-release"), 360));
  }, { passive: true });

  document.addEventListener("pointercancel", clearActive, { passive: true });
  touchMedia.addEventListener?.("change", clearActive);
  reducedMotion.addEventListener?.("change", clearActive);
})();
