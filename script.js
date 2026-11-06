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

  // Menu mobile (registrato prima delle ancore Lenis: il menu si chiude
  // e Lenis riparte prima che parta lo scroll verso l'ancora)
  const mnav = document.getElementById('mobileNav');
  const navToggle = document.querySelector('.nav-toggle');
  if (mnav && navToggle) {
    const openNav = () => {
      mnav.hidden = false;
      navToggle.setAttribute('aria-expanded', 'true');
      document.documentElement.classList.add('nav-lock');
      if (lenis) lenis.stop();
      requestAnimationFrame(() => mnav.classList.add('is-open'));
      mnav.querySelector('.mnav-close').focus();
    };
    const closeNav = (restoreFocus = true) => {
      if (mnav.hidden) return;
      mnav.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
      document.documentElement.classList.remove('nav-lock');
      if (lenis) lenis.start();
      setTimeout(() => { mnav.hidden = true; }, prefersReducedMotion ? 0 : 350);
      if (restoreFocus) navToggle.focus({ preventScroll: true });
    };
    navToggle.addEventListener('click', openNav);
    mnav.querySelector('.mnav-close').addEventListener('click', () => closeNav());
    mnav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => closeNav(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeNav(); });
    window.matchMedia('(min-width: 1100px)').addEventListener('change', (e) => { if (e.matches) closeNav(false); });
  }

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

  // Spazi: lightbox a schermo intero (una galleria per sala)
  const pad2 = (n) => String(n).padStart(2, '0');
  const lightbox = (() => {
    const el = document.createElement('div');
    el.className = 'lb';
    el.hidden = true;
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', 'Galleria foto');
    el.setAttribute('data-lenis-prevent', '');
    el.innerHTML = `
      <div class="lb-top">
        <span class="lb-title"></span>
        <span class="lb-count"></span>
        <button type="button" class="lb-close" aria-label="Chiudi galleria">✕</button>
      </div>
      <div class="lb-stage">
        <img class="lb-img" alt="" />
        <button type="button" class="lb-nav lb-prev" aria-label="Foto precedente">←</button>
        <button type="button" class="lb-nav lb-next" aria-label="Foto successiva">→</button>
      </div>
      <p class="lb-caption"></p>
      <div class="lb-thumbs"></div>`;
    document.body.appendChild(el);

    const q = (s) => el.querySelector(s);
    const img = q('.lb-img');
    const thumbs = q('.lb-thumbs');
    let photos = [], idx = 0, lastFocus = null;

    const show = (i) => {
      idx = (i + photos.length) % photos.length;
      const p = photos[idx];
      img.classList.add('is-loading');
      const pre = new Image();
      pre.onload = pre.onerror = () => {
        img.src = p.src;
        img.alt = p.alt;
        requestAnimationFrame(() => img.classList.remove('is-loading'));
      };
      pre.src = p.src;
      [idx + 1, idx - 1].forEach((j) => { new Image().src = photos[(j + photos.length) % photos.length].src; });
      q('.lb-count').textContent = `${pad2(idx + 1)} / ${pad2(photos.length)}`;
      q('.lb-caption').textContent = p.alt;
      thumbs.querySelectorAll('button').forEach((b, j) => {
        b.classList.toggle('is-on', j === idx);
        if (j === idx) b.scrollIntoView({ block: 'nearest', inline: 'center', behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      });
    };

    const open = (list, i, title) => {
      photos = list;
      lastFocus = document.activeElement;
      q('.lb-title').textContent = title;
      const single = photos.length < 2;
      el.querySelectorAll('.lb-nav').forEach((b) => (b.hidden = single));
      thumbs.hidden = single;
      thumbs.innerHTML = photos
        .map((p, j) => `<button type="button" aria-label="Foto ${j + 1}"><img src="${p.thumb}" alt="" loading="lazy" /></button>`)
        .join('');
      thumbs.querySelectorAll('button').forEach((b, j) => b.addEventListener('click', () => show(j)));
      el.hidden = false;
      document.documentElement.classList.add('lb-lock');
      if (lenis) lenis.stop();
      requestAnimationFrame(() => el.classList.add('is-open'));
      show(i);
      q('.lb-close').focus();
    };

    const close = () => {
      el.classList.remove('is-open');
      setTimeout(() => {
        el.hidden = true;
        document.documentElement.classList.remove('lb-lock');
        if (lenis) lenis.start();
      }, prefersReducedMotion ? 0 : 300);
      if (lastFocus) lastFocus.focus({ preventScroll: true });
    };

    q('.lb-close').addEventListener('click', close);
    q('.lb-prev').addEventListener('click', () => show(idx - 1));
    q('.lb-next').addEventListener('click', () => show(idx + 1));
    el.addEventListener('click', (e) => { if (e.target === el || e.target.classList.contains('lb-stage')) close(); });
    document.addEventListener('keydown', (e) => {
      if (el.hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') show(idx + 1);
      else if (e.key === 'ArrowLeft') show(idx - 1);
      else if (e.key === 'Tab') {
        const f = Array.from(el.querySelectorAll('button')).filter((b) => b.offsetParent);
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });

    // Swipe: orizzontale cambia foto, verso il basso chiude
    let x0 = null, y0 = null;
    const stage = q('.lb-stage');
    stage.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    stage.addEventListener('touchend', (e) => {
      if (x0 == null) return;
      const dx = e.changedTouches[0].clientX - x0;
      const dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) show(idx + (dx < 0 ? 1 : -1));
      else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) close();
      x0 = y0 = null;
    });

    return { open };
  })();

  // Spazi: un carosello per sala (frecce, contatore, barra di avanzamento)
  document.querySelectorAll('.room').forEach((room) => {
    const track = room.querySelector('.room-track');
    const slides = Array.from(track.querySelectorAll('.room-slide'));
    const count = room.querySelector('.room-count b');
    const bar = room.querySelector('.room-progress span');
    const prev = room.querySelector('.room-arrow[data-dir="-1"]');
    const next = room.querySelector('.room-arrow[data-dir="1"]');
    const title = room.querySelector('.space-tag')?.textContent.trim() || '';
    const photos = slides.map((s) => {
      const im = s.querySelector('img');
      const small = (im.getAttribute('srcset') || '').split(',')[0].trim().split(' ')[0];
      return { src: im.getAttribute('src'), thumb: small || im.getAttribute('src'), alt: im.alt };
    });

    const current = () => {
      let best = 0, dist = Infinity;
      slides.forEach((s, i) => {
        const d = Math.abs(s.offsetLeft - slides[0].offsetLeft - track.scrollLeft);
        if (d < dist) { dist = d; best = i; }
      });
      return best;
    };
    const update = () => {
      const max = track.scrollWidth - track.clientWidth;
      const atEnd = track.scrollLeft >= max - 4;
      if (count) count.textContent = pad2((atEnd ? slides.length - 1 : current()) + 1);
      if (bar) bar.style.setProperty('--p', max > 0 ? Math.max(0.06, track.scrollLeft / max) : 1);
      if (prev) prev.disabled = track.scrollLeft <= 4;
      if (next) next.disabled = atEnd;
    };
    const go = (dir) => {
      const i = Math.min(slides.length - 1, Math.max(0, current() + dir));
      track.scrollTo({ left: slides[i].offsetLeft - slides[0].offsetLeft, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    };

    if (prev) prev.addEventListener('click', () => go(-1));
    if (next) next.addEventListener('click', () => go(1));
    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    });
    slides.forEach((s, i) => s.addEventListener('click', () => lightbox.open(photos, i, title)));
    // Gesto orizzontale del trackpad: lascia scorrere il carosello invece di passarlo a Lenis
    track.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) e.stopPropagation();
    }, { passive: true });
    track.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
    window.addEventListener('resize', update);
    update();
  });

})();
