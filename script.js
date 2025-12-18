document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.querySelectorAll('nav a[href^="#"]');
  if (!navLinks.length) return;

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || href === '#') return; 

      const id = decodeURIComponent(href.slice(1));
      const target = document.getElementById(id);
      if (!target) return; 

      e.preventDefault();

      // Use smooth scrolling
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });

      try {
        history.pushState(null, '', '#' + encodeURIComponent(id));
      } catch (err) {
        location.hash = id;
      }

      // Accessibility: focus the target after scrolling completes
      const prevTabIndex = target.getAttribute('tabindex');
      const shouldRemoveTabIndex = prevTabIndex === null;
      if (shouldRemoveTabIndex) target.setAttribute('tabindex', '-1');

      setTimeout(() => {
        try { target.focus({ preventScroll: true }); } catch (ignore) {}
        if (shouldRemoveTabIndex) target.removeAttribute('tabindex');
      }, 400);
    });
  });
});

// Projects filter feature
function filterProjects(category) {
  const normalized = (category || 'all').toString().toLowerCase();

  const cards = Array.from(document.querySelectorAll('.project-card'));
  if (!cards.length) return;

  cards.forEach(card => {
    const cardCat = (card.dataset.category || '').toString().toLowerCase();

    let match = false;
    if (normalized === 'all') {
      match = true;
    } else if (cardCat && cardCat === normalized) {
      match = true;
    } else if ([...card.classList].some(c => c.toLowerCase() === normalized)) {
      match = true;
    } else if (card.textContent && card.textContent.toLowerCase().includes(normalized)) {
      match = true;
    }

    card.style.display = match ? '' : 'none';
  });

  const buttons = document.querySelectorAll('#project-filters .filter-btn');
  buttons.forEach(btn => {
    const btnCat = (btn.getAttribute('data-filter') || 'all').toString().toLowerCase();
    btn.setAttribute('aria-pressed', btnCat === normalized ? 'true' : 'false');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('project-filters')) return;

  const articles = Array.from(document.querySelectorAll('article'));
  let projectsArticle = null;
  for (const a of articles) {
    if (a.querySelector && a.querySelector('.project-card')) {
      projectsArticle = a;
      break;
    }
  }
  if (!projectsArticle) return;

  const cards = Array.from(projectsArticle.querySelectorAll('.project-card'));
  if (!cards.length) return;

  const categorySet = new Set();
  cards.forEach(c => {
    const d = (c.dataset.category || '').toString().trim();
    if (d) categorySet.add(d);
  });

  const filters = document.createElement('div');
  filters.id = 'project-filters';
  filters.setAttribute('aria-label', 'Project filters');
  filters.style.marginBottom = '12px';

  const createBtn = (cat, label, pressed) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'filter-btn';
    btn.setAttribute('data-filter', cat);
    btn.setAttribute('aria-pressed', pressed ? 'true' : 'false');
    btn.textContent = label;
    btn.addEventListener('click', () => filterProjects(cat));
    return btn;
  };

  filters.appendChild(createBtn('all', 'All', true));

  Array.from(categorySet).sort().forEach(cat => {
    filters.appendChild(createBtn(cat, cat.charAt(0).toUpperCase() + cat.slice(1), false));
  });

  if (categorySet.size === 0) {
    const inferred = new Set();
    cards.forEach(c => {
      const title = (c.querySelector('h2') && c.querySelector('h2').textContent) || '';
      const t = title.toLowerCase();
      if (t.includes('web')) inferred.add('web');
      if (t.includes('data')) inferred.add('data');
    });
    Array.from(inferred).sort().forEach(cat => filters.appendChild(createBtn(cat, cat.charAt(0).toUpperCase() + cat.slice(1), false)));
  }

  projectsArticle.parentNode.insertBefore(filters, projectsArticle);
});

window.filterProjects = filterProjects;

// Contact form validation
document.addEventListener('DOMContentLoaded', () => {
  // Find the contact form by locating the fields used in the page
  const contactForm = document.querySelector('form');
  if (!contactForm) return;

  const nameInput = contactForm.querySelector('#name');
  const emailInput = contactForm.querySelector('#email');
  const messageInput = contactForm.querySelector('#message');
  if (!nameInput || !emailInput || !messageInput) return;

  const emailRe = /^\S+@\S+\.\S+$/;

  function ensureErrorElement(input) {
    let err = input.parentNode.querySelector('.form-error');
    if (!err) {
      err = document.createElement('div');
      err.className = 'form-error';
      err.setAttribute('role', 'alert');
      err.setAttribute('aria-live', 'assertive');
      err.style.color = '#c0392b';
      err.style.fontSize = '0.95em';
      err.style.marginTop = '6px';
      input.parentNode.appendChild(err);
    }
    return err;
  }

  function showError(input, message) {
    const err = ensureErrorElement(input);
    err.textContent = message;
    input.setAttribute('aria-invalid', 'true');
  }

  function clearError(input) {
    const err = input.parentNode.querySelector('.form-error');
    if (err) err.textContent = '';
    input.removeAttribute('aria-invalid');
  }

  function validateInputs() {
    let valid = true;
    const nameVal = (nameInput.value || '').trim();
    const emailVal = (emailInput.value || '').trim();
    const msgVal = (messageInput.value || '').trim();

    if (!nameVal) {
      showError(nameInput, 'Please enter your name.');
      valid = false;
    } else {
      clearError(nameInput);
    }

    if (!emailVal) {
      showError(emailInput, 'Please enter your email address.');
      valid = false;
    } else if (!emailRe.test(emailVal)) {
      showError(emailInput, 'Please enter a valid email address.');
      valid = false;
    } else {
      clearError(emailInput);
    }

    if (!msgVal) {
      showError(messageInput, 'Please enter a message.');
      valid = false;
    } else {
      clearError(messageInput);
    }

    return valid;
  }

  // Validate on input to clear errors early
  [nameInput, emailInput, messageInput].forEach(inp => {
    inp.addEventListener('input', () => clearError(inp));
    inp.addEventListener('blur', validateInputs);
  });

  contactForm.addEventListener('submit', (e) => {
    const ok = validateInputs();
    if (!ok) {
      e.preventDefault();
      // focus first invalid field
      const firstInvalid = contactForm.querySelector('[aria-invalid="true"]');
      if (firstInvalid && typeof firstInvalid.focus === 'function') firstInvalid.focus();
    }
  });
});
