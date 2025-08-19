document.addEventListener('DOMContentLoaded', () => {
  const sections = document.querySelectorAll('.reveal');
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  const menuLinks = document.querySelectorAll('.nav-links a');
  const header = document.querySelector('header');

  /* --- Animação de revelar com respeito à acessibilidade --- */
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!prefersReduced && 'IntersectionObserver' in window) {
    const revealSection = (entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    };
    const io = new IntersectionObserver(revealSection, {
      root: null,
      rootMargin: '0px 0px -10% 0px',
      threshold: 0.15
    });
    sections.forEach(sec => io.observe(sec));
  } else {
    sections.forEach(sec => sec.classList.add('visible'));
  }

  /* --- Controle do menu mobile (acessível) --- */
  function openMenu() {
    navLinks.classList.add('nav-active');
    hamburger.classList.add('toggle');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  function closeMenu() {
    navLinks.classList.remove('nav-active');
    hamburger.classList.remove('toggle');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', () => {
    const expanded = hamburger.getAttribute('aria-expanded') === 'true';
    expanded ? closeMenu() : openMenu();
  });

  // Fecha ao clicar em um link
  menuLinks.forEach(link => {
    link.addEventListener('click', e => {
      // scroll suave com compensação do header fixo
      const id = link.getAttribute('href');
      if (id && id.startsWith('#')) {
        e.preventDefault();
        const target = document.querySelector(id);
        if (target) {
          const headerH = header.offsetHeight || 70;
          const top = target.getBoundingClientRect().top + window.scrollY - (headerH + 16);
          window.scrollTo({ top, behavior: prefersReduced ? 'auto' : 'smooth' });
          closeMenu();
        }
      }
    });
  });

  // Fecha com Esc e ao clicar fora
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && navLinks.classList.contains('nav-active')) closeMenu();
  });
  document.addEventListener('click', e => {
    if (!navLinks.contains(e.target) && !hamburger.contains(e.target) && navLinks.classList.contains('nav-active')) {
      closeMenu();
    }
  });

  /* --- Scroll spy simples para destacar link ativo --- */
  const sectionsForSpy = document.querySelectorAll('main section[id]');
  const spy = () => {
    let current = null;
    const offset = (header.offsetHeight || 70) + 40;

    sectionsForSpy.forEach(sec => {
      const top = sec.offsetTop - offset;
      if (window.scrollY >= top) current = sec.id;
    });

    menuLinks.forEach(a => {
      const href = a.getAttribute('href') || '';
      const id = href.startsWith('#') ? href.slice(1) : '';
      if (id && id === current) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  };
  spy();
  window.addEventListener('scroll', spy, { passive: true });
  /* --- Validação básica do formulário no cliente + envio Formspree --- */
  const form = document.querySelector('form');
  form?.addEventListener('submit', e => {
    const nome = document.getElementById('nome');
    const email = document.getElementById('email');
    const msg = document.getElementById('mensagem');
    const errNome = document.getElementById('erro-nome');
    const errEmail = document.getElementById('erro-email');
    const errMsg = document.getElementById('erro-mensagem');

    let ok = true;

    // validações básicas
    if (!nome.value.trim()) {
      ok = false;
      nome.setAttribute('aria-invalid', 'true');
      errNome.textContent = 'Informe seu nome.';
    } else {
      nome.setAttribute('aria-invalid', 'false');
      errNome.textContent = '';
    }

    const emailVal = email.value.trim();
    if (!emailVal || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      ok = false;
      email.setAttribute('aria-invalid', 'true');
      errEmail.textContent = 'Informe um e-mail válido.';
    } else {
      email.setAttribute('aria-invalid', 'false');
      errEmail.textContent = '';
    }

    if (!msg.value.trim()) {
      ok = false;
      msg.setAttribute('aria-invalid', 'true');
      errMsg.textContent = 'Escreva uma mensagem.';
    } else {
      msg.setAttribute('aria-invalid', 'false');
      errMsg.textContent = '';
    }

    // interrompe se inválido
    if (!ok) {
      e.preventDefault();
      return;
    }

    // Envio assíncrono para o endpoint do Formspree definido no action do <form>
    e.preventDefault();

    // honeypot anti-spam (campo oculto "website")
    const honey = form.querySelector('input[name="website"]');
    if (honey && honey.value) {
      return; // bot ignorado
    }

    // elemento de status (usa o <p class="form-status"> do HTML)
    let statusEl = form.querySelector('.form-status');
    if (!statusEl) {
      statusEl = document.createElement('p');
      statusEl.className = 'form-status';
      statusEl.setAttribute('role', 'status');
      statusEl.setAttribute('aria-live', 'polite');
      form.appendChild(statusEl);
    }

    statusEl.textContent = 'Enviando...';

    const data = new FormData(form);
    const btn = form.querySelector('button[type="submit"]');
    btn?.setAttribute('disabled', 'true');

    fetch(form.action, {
      method: 'POST',
      body: data,
      headers: { 'Accept': 'application/json' }
    })
    .then(res => {
      if (res.ok) {
        statusEl.textContent = 'Mensagem enviada com sucesso! Você será respondido logo no email informado no formulário.';
        statusEl.className = 'form-status success'; // <- aplica verde
        form.reset();
      } else {
        return res.json().then(j => {
          throw new Error(j?.error || 'Falha ao enviar. Tente novamente.');
        });
      }
    })
    .catch(() => {
      statusEl.textContent = 'Aconteceu alguma coisa de errado, tente novamente mais tarde.';
      statusEl.className = 'form-status error'; // <- aplica vermelho
    })
    .finally(() => {
      btn?.removeAttribute('disabled');
    });
  });


});
