(() => {
  // Header scroll state
  const header = document.getElementById('siteHeader');
  const sticky = document.getElementById('stickyCta');
  const hero   = document.querySelector('.hero');
  const heroDarken = document.querySelector('.hero-darken');
  const ctaSection = document.getElementById('contatti');

  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > window.innerHeight * 0.85);

    // Hero darkening: progressivo da 0 a 1 mentre la hero viene coperta
    if (heroDarken) {
      const vh = window.innerHeight;
      const t = Math.min(1, Math.max(0, y / (vh * 0.9)));
      heroDarken.style.opacity = (t * t).toFixed(3);
    }

    // Sticky mobile CTA: show after hero, hide near form
    const heroBottom = hero ? hero.offsetTop + hero.offsetHeight : 0;
    const ctaTop = ctaSection ? ctaSection.offsetTop : Infinity;
    const inForm = y + window.innerHeight > ctaTop + 100;
    if (sticky) sticky.classList.toggle('is-visible', y > heroBottom - 200 && !inForm);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

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
    const updateMarquee = () => {
      const rect = marquee.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = rect.height + vh;
      const progress = Math.min(1, Math.max(0, (vh - rect.top) / total));
      tracks.forEach(track => {
        const halfWidth = track.scrollWidth / 2;
        const dir = track.parentElement.classList.contains('food-row--rtl') ? 1 : -1;
        const x = dir * progress * halfWidth;
        const baseOffset = dir === 1 ? -halfWidth : 0;
        track.style.transform = `translate3d(${baseOffset + x}px, 0, 0)`;
      });
    };
    let ticking = false;
    const onMarqueeScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => { updateMarquee(); ticking = false; });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onMarqueeScroll, { passive: true });
    window.addEventListener('resize', onMarqueeScroll);
    updateMarquee();
  }

  // Form validation + fake submit
  const form = document.getElementById('leadForm');
  const success = document.getElementById('formSuccess');
  if (form) {
    const fields = {
      nome: { msg: 'Inserisci il tuo nome', test: v => v.trim().length >= 2 },
      telefono: { msg: 'Telefono non valido', test: v => /^[+\d][\d\s().-]{6,}$/.test(v.trim()) },
      email: { msg: 'Email non valida', test: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) }
    };

    Object.keys(fields).forEach(name => {
      const input = form.elements[name];
      input.addEventListener('blur', () => {
        const wrap = input.closest('.field');
        const ok = fields[name].test(input.value);
        wrap.classList.toggle('has-error', !ok && input.value.length > 0);
        if (!ok && input.value.length > 0) wrap.dataset.error = fields[name].msg;
      });
      input.addEventListener('input', () => {
        const wrap = input.closest('.field');
        if (wrap.classList.contains('has-error') && fields[name].test(input.value)) {
          wrap.classList.remove('has-error');
        }
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;
      Object.keys(fields).forEach(name => {
        const input = form.elements[name];
        const wrap = input.closest('.field');
        const ok = fields[name].test(input.value);
        if (!ok) {
          wrap.classList.add('has-error');
          wrap.dataset.error = fields[name].msg;
          valid = false;
        }
      });
      if (!valid) {
        const firstErr = form.querySelector('.has-error input');
        if (firstErr) firstErr.focus();
        return;
      }

      // Disable button
      const btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.querySelector('span').textContent = 'Invio in corso...';

      // Simulate submission (replace with real endpoint)
      const data = {
        nome: form.elements.nome.value.trim(),
        telefono: form.elements.telefono.value.trim(),
        email: form.elements.email.value.trim(),
        ts: new Date().toISOString()
      };
      console.log('Lead Villa Torre Rossa:', data);

      setTimeout(() => {
        form.hidden = true;
        success.hidden = false;
        success.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 700);
    });
  }
})();
