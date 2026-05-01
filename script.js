(() => {
  // Header scroll state + Hero viscous parallax
  const header = document.getElementById('siteHeader');
  const heroDarken = document.querySelector('.hero-darken');
  const heroImg = document.querySelector('.hero-img');
  const heroContent = document.querySelector('.hero-content');
  const heroScrollHint = document.querySelector('.hero-scroll');
  let lenis = null;

  // Disabilita parallax viscoso se l'utente preferisce ridurre il movimento
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (window.Lenis && !prefersReducedMotion) {
    lenis = new window.Lenis({
      duration: 1.35,
      wheelMultiplier: 0.9,
      touchMultiplier: 1,
      smoothWheel: true,
      syncTouch: false,
      easing: (t) => 1 - Math.pow(1 - t, 3)
    });

    const lenisTick = (time) => {
      lenis.raf(time);
      requestAnimationFrame(lenisTick);
    };
    requestAnimationFrame(lenisTick);

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (event) => {
        const href = link.getAttribute('href');
        if (!href || href === '#') return;

        const target = document.querySelector(href);
        if (!target) return;

        event.preventDefault();
        lenis.scrollTo(target, {
          duration: 1.4,
          offset: -12
        });
      });
    });
  }

  // Stato animazione con smoothing (lerp) per un effetto "viscoso"
  const heroState = {
    targetScale: 1.05,
    currentScale: 1.05,
    targetContentY: 0,
    currentContentY: 0,
    targetDarken: 0,
    currentDarken: 0,
  };
  const LERP = prefersReducedMotion ? 1 : 0.085; // più piccolo = più viscoso
  let heroRaf = null;

  const computeHeroTargets = () => {
    const y = window.scrollY;
    const vh = window.innerHeight;
    const t = Math.min(1, Math.max(0, y / vh));
    // Zoom progressivo
    heroState.targetScale = 1.05 + t * 0.12;
    // Contenuto: sale leggermente con smoothing per effetto trascinamento
    heroState.targetContentY = -y * 0.18;
    // Oscuramento progressivo
    heroState.targetDarken = Math.min(1, Math.max(0, y / (vh * 0.9))) ** 2;
  };

  const heroTick = () => {
    let active = false;
    const lerpVal = (cur, tgt) => {
      const diff = tgt - cur;
      if (Math.abs(diff) > 0.001) { active = true; return cur + diff * LERP; }
      return tgt;
    };
    heroState.currentScale = lerpVal(heroState.currentScale, heroState.targetScale);
    heroState.currentContentY = lerpVal(heroState.currentContentY, heroState.targetContentY);
    heroState.currentDarken = lerpVal(heroState.currentDarken, heroState.targetDarken);

    if (heroImg) {
      heroImg.style.transform = `scale(${heroState.currentScale.toFixed(4)})`;
    }
    if (heroContent) {
      const fade = Math.max(0, 1 - Math.abs(heroState.currentContentY) / (window.innerHeight * 0.5));
      heroContent.style.transform = `translate3d(0, ${heroState.currentContentY.toFixed(2)}px, 0)`;
      heroContent.style.opacity = fade.toFixed(3);
    }
    if (heroScrollHint) {
      const fadeHint = Math.max(0, 1 - window.scrollY / (window.innerHeight * 0.3));
      heroScrollHint.style.opacity = fadeHint.toFixed(3);
    }
    if (heroDarken) {
      heroDarken.style.opacity = heroState.currentDarken.toFixed(3);
    }
    heroRaf = active ? requestAnimationFrame(heroTick) : null;
  };

  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > window.innerHeight * 0.85);
    computeHeroTargets();
    if (heroRaf == null) heroRaf = requestAnimationFrame(heroTick);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  computeHeroTargets();
  // Inizializza i valori senza animazione al primo render
  heroState.currentScale = heroState.targetScale;
  heroState.currentContentY = heroState.targetContentY;
  heroState.currentDarken = heroState.targetDarken;
  heroRaf = requestAnimationFrame(heroTick);

  // Reveal on scroll
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    }
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // Food marquee: scroll-linked horizontal translate
  const marquee = document.getElementById('foodMarquee');
  if (marquee) {
    const tracks = marquee.querySelectorAll('.food-track');
    const TRAVEL = 0.55; // frazione di halfWidth percorsa: più piccolo = più lento
    const LERP = 0.08;   // smoothing: più piccolo = più fluido/lento
    const trackState = Array.from(tracks).map(() => ({ current: 0, target: 0 }));
    const computeTargets = () => {
      const rect = marquee.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = rect.height + vh;
      const progress = Math.min(1, Math.max(0, (vh - rect.top) / total));
      tracks.forEach((track, i) => {
        const halfWidth = track.scrollWidth / 2;
        const dir = track.parentElement.classList.contains('food-row--rtl') ? 1 : -1;
        const baseOffset = dir === 1 ? -halfWidth : 0;
        trackState[i].halfWidth = halfWidth;
        trackState[i].baseOffset = baseOffset;
        trackState[i].target = baseOffset + dir * progress * halfWidth * TRAVEL;
      });
    };
    let rafId = null;
    const tick = () => {
      let active = false;
      tracks.forEach((track, i) => {
        const s = trackState[i];
        const diff = s.target - s.current;
        if (Math.abs(diff) > 0.05) {
          s.current += diff * LERP;
          active = true;
        } else {
          s.current = s.target;
        }
        track.style.transform = `translate3d(${s.current}px, 0, 0)`;
      });
      rafId = active ? requestAnimationFrame(tick) : null;
    };
    const onMarqueeScroll = () => {
      computeTargets();
      if (rafId == null) rafId = requestAnimationFrame(tick);
    };
    window.addEventListener('scroll', onMarqueeScroll, { passive: true });
    window.addEventListener('resize', onMarqueeScroll);
    computeTargets();
    trackState.forEach((s, i) => { s.current = s.target; tracks[i].style.transform = `translate3d(${s.current}px, 0, 0)`; });
  }

})();
