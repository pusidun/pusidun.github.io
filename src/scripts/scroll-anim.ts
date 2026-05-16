// Homepage scroll animations. Robust against the user scrolling past
// a section before GSAP initializes — elements never get stuck invisible.

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function isInView(el: Element): boolean {
  const r = el.getBoundingClientRect();
  return r.top < window.innerHeight && r.bottom > 0;
}
function isPast(el: Element): boolean {
  return el.getBoundingClientRect().bottom <= 0;
}

export function initHomeScroll() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // No animation: elements are visible by default in CSS, nothing to do.
    return;
  }

  // ---- Arcana section: cards reveal one-by-one with scroll.
  //      Desktop (lg+): pin + scrub timeline.
  //      Smaller screens: no pin (content can exceed 100vh), staggered triggers. ----
  const arcanaSection = document.getElementById('arcana-section');
  if (arcanaSection) {
    const header = arcanaSection.querySelector<HTMLElement>('[data-arcana-header]');
    const cards = Array.from(
      arcanaSection.querySelectorAll<HTMLElement>('[data-arcana-card]')
    );

    // Header reveal — same for all viewports.
    if (header && !isInView(header) && !isPast(header)) {
      gsap.set(header, { opacity: 0, y: 30 });
      gsap.to(header, {
        scrollTrigger: {
          trigger: arcanaSection,
          start: 'top 90%',
          once: true,
        },
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: 'power3.out',
      });
    }

    if (cards.length > 0) {
      // Hidden initial state for cards (only if user hasn't already scrolled past).
      const setHidden = (card: HTMLElement, i: number) => {
        const rotate = (i - (cards.length - 1) / 2) * 4;
        gsap.set(card, {
          opacity: 0,
          y: 60,
          rotateY: -30,
          rotateZ: rotate - 6,
          scale: 0.85,
        });
      };

      const isDesktop = window.matchMedia('(min-width: 1024px)').matches;

      if (isDesktop) {
        // Pin & scrub: cards reveal as user scrolls through pinned section.
        cards.forEach((card, i) => setHidden(card, i));

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: arcanaSection,
            start: 'top top',
            end: '+=' + cards.length * 40 + '%',
            pin: true,
            scrub: 0.6,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });
        cards.forEach((card, i) => {
          const rotate = (i - (cards.length - 1) / 2) * 4;
          tl.to(card, {
            opacity: 1,
            y: 0,
            rotateY: 0,
            rotateZ: rotate,
            scale: 1,
            duration: 1,
            ease: 'back.out(1.6)',
          }, i);
        });
      } else {
        // Mobile / tablet: no pin. Each card has its own trigger as it scrolls in.
        cards.forEach((card, i) => {
          if (isInView(card) || isPast(card)) {
            const rotate = (i - (cards.length - 1) / 2) * 4;
            gsap.set(card, { opacity: 1, y: 0, rotateY: 0, rotateZ: rotate, scale: 1 });
            return;
          }
          setHidden(card, i);
          const rotate = (i - (cards.length - 1) / 2) * 4;
          gsap.to(card, {
            scrollTrigger: {
              trigger: card,
              start: 'top 88%',
              once: true,
            },
            opacity: 1,
            y: 0,
            rotateY: 0,
            rotateZ: rotate,
            scale: 1,
            duration: 0.55,
            ease: 'back.out(1.5)',
            delay: i * 0.06,
          });
        });
      }
    }
  }

  // ---- Latest posts ----
  const latestSection = document.getElementById('latest-section');
  if (latestSection) {
    const header = latestSection.querySelector<HTMLElement>('[data-latest-header]');
    const items = Array.from(
      latestSection.querySelectorAll<HTMLElement>('[data-latest-item]')
    );

    if (header) {
      if (isInView(header) || isPast(header)) {
        // visible already
      } else {
        gsap.set(header, { opacity: 0, x: -50 });
        gsap.to(header, {
          scrollTrigger: {
            trigger: latestSection,
            start: 'top 90%',
            once: true,
          },
          opacity: 1,
          x: 0,
          duration: 0.6,
          ease: 'power2.out',
        });
      }
    }

    items.forEach((item, i) => {
      if (isInView(item) || isPast(item)) {
        gsap.set(item, { opacity: 1, x: 0 });
        return;
      }
      gsap.set(item, { opacity: 0, x: -80 });
      gsap.to(item, {
        scrollTrigger: {
          trigger: item,
          start: 'top 95%',
          once: true,
        },
        opacity: 1,
        x: 0,
        duration: 0.55,
        ease: 'power3.out',
        delay: i * 0.08,
      });
    });
  }

  // Recompute positions after any layout settling (fonts, lazy images).
  setTimeout(() => ScrollTrigger.refresh(), 100);
}
