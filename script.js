(() => {
  // Header scroll state
  const header = document.getElementById('siteHeader');
  const sticky = document.getElementById('stickyCta');
  const hero   = document.querySelector('.hero');
  const ctaSection = document.getElementById('contatti');

  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 60);

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
