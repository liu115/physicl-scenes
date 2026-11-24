// import { setUpViewer } from "./viewer.js";
import { setUpGallery } from "./gallery.js";
import { setUpAssetGallery } from "./asset-gallery.js";
import { setUpLighting } from "./lighting.js";
import { preventBadBreaks } from "./typography.js";

const topbar = document.querySelector(".topbar");
const nav = document.querySelector(".nav-links");
const navLinks = [...nav.querySelectorAll("a")];
const sections = navLinks.map((a) => document.querySelector(a.getAttribute("href")));
let activeIndex = -1;
let clickedIndex = null;

function currentSectionIndex() {
  const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
  if (atBottom) return sections.length - 1;
  const probe = window.innerHeight * 0.3;
  let index = 0;
  sections.forEach((section, i) => {
    if (section.getBoundingClientRect().top <= probe) index = i;
  });
  return index;
}

function revealInNav(link) {
  const left = link.offsetLeft - nav.offsetLeft;
  const right = left + link.offsetWidth;
  if (left < nav.scrollLeft) nav.scrollLeft = left;
  else if (right > nav.scrollLeft + nav.clientWidth) nav.scrollLeft = right - nav.clientWidth + 28;
}

function updateNavFade() {
  nav.classList.toggle("at-start", nav.scrollLeft <= 1);
  nav.classList.toggle("at-end", nav.scrollLeft + nav.clientWidth >= nav.scrollWidth - 1);
}

function update() {
  topbar.classList.toggle("scrolled", window.scrollY > 0);
  const index = clickedIndex ?? currentSectionIndex();
  if (index !== activeIndex) {
    activeIndex = index;
    navLinks.forEach((a, i) => a.classList.toggle("active", i === index));
    revealInNav(navLinks[index]);
  }
  updateNavFade();
}

document.addEventListener("click", (event) => {
  const link = event.target.closest('a[href^="#"]');
  if (!link) return;
  const index = sections.indexOf(document.querySelector(link.getAttribute("href")));
  if (index === -1) return;
  clickedIndex = index;
  update();
});

function releaseClickedSection() {
  if (clickedIndex === null) return;
  clickedIndex = null;
  update();
}
for (const type of ["wheel", "touchstart", "keydown", "mousedown"]) {
  window.addEventListener(type, (event) => {
    if (type === "mousedown" && event.target.closest('a[href^="#"]')) return;
    releaseClickedSection();
  }, { passive: true });
}

window.addEventListener("scroll", update, { passive: true });
window.addEventListener("resize", update);
nav.addEventListener("scroll", updateNavFade, { passive: true });
update();

const copyButton = document.querySelector(".bibtex .copy");
copyButton.addEventListener("click", async () => {
  await navigator.clipboard.writeText(document.querySelector(".bibtex code").textContent);
  copyButton.textContent = "Copied";
  setTimeout(() => (copyButton.textContent = "Copy"), 1500);
});

function setUpCarousel(section) {
  const carousel = section.querySelector(".carousel");
  const track = carousel.querySelector(".carousel-track");
  const cards = [...track.children];
  let first = 0;
  let inView = false;

  const visibleCount = () => parseInt(getComputedStyle(carousel).getPropertyValue("--visible"), 10);
  const step = () => cards[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap);

  function syncPlayback() {
    const visible = visibleCount();
    cards.forEach((card, i) => {
      const video = card.querySelector("video");
      const slot = (i - first + cards.length) % cards.length;
      const shown = slot < visible;
      card.setAttribute("aria-hidden", String(!shown));
      if (shown && inView) {
        video.preload = "auto";
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }

  function layout() {
    cards.forEach((card, i) => {
      card.style.order = String((i - first + cards.length) % cards.length);
    });
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let busy = false;

  function setTransform(px, animate) {
    track.classList.toggle("sliding", animate);
    track.style.transform = px ? `translateX(${px}px)` : "";
    if (!animate) track.getBoundingClientRect();
  }

  function finishSlide(callback) {
    track.addEventListener("transitionend", function done(event) {
      if (event.target !== track) return;
      track.removeEventListener("transitionend", done);
      callback();
    });
  }

  function rotate(direction) {
    if (busy) return;
    first = (first + direction + cards.length) % cards.length;

    if (reducedMotion.matches) {
      layout();
      syncPlayback();
      return;
    }

    busy = true;
    const offset = step();
    if (direction > 0) {
      syncPlayback();
      setTransform(-offset, true);
      finishSlide(() => {
        layout();
        setTransform(0, false);
        busy = false;
      });
    } else {
      layout();
      setTransform(-offset, false);
      syncPlayback();
      setTransform(0, true);
      finishSlide(() => {
        track.classList.remove("sliding");
        busy = false;
      });
    }
  }

  section.querySelectorAll("[data-step]").forEach((button) => {
    button.addEventListener("click", () => rotate(Number(button.dataset.step)));
  });

  let touchStartX = null;
  carousel.addEventListener("touchstart", (event) => {
    touchStartX = event.touches[0].clientX;
  }, { passive: true });
  carousel.addEventListener("touchend", (event) => {
    if (touchStartX === null) return;
    const dx = event.changedTouches[0].clientX - touchStartX;
    touchStartX = null;
    if (Math.abs(dx) > 40) rotate(dx < 0 ? 1 : -1);
  }, { passive: true });

  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    syncPlayback();
  }, { threshold: 0.25 }).observe(carousel);

  window.addEventListener("resize", syncPlayback);
  layout();
}

setUpCarousel(document.querySelector("#robots"));

// setUpViewer(document.querySelector("#explore"));
setUpGallery(document.querySelector(".gallery"));
setUpAssetGallery(document.querySelector("#assets"));
setUpLighting(document.querySelector(".lighting"));
preventBadBreaks(document.querySelector("main"));
