const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// ===== Écran de chargement =====
(function loader() {
    const loader = $('#loader');
    const num = $('#loader-num');
    const bar = $('#loader-bar');
    const finish = () => {
        loader.classList.add('done');
        document.body.classList.remove('is-loading');
        document.body.classList.add('loaded');
        setTimeout(() => loader.remove(), 1100);
    };

    if (reduceMotion) { finish(); return; }

    document.body.classList.add('is-loading');
    const duration = 1600;
    const start = performance.now();
    const tick = now => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        const v = Math.round(eased * 100);
        num.textContent = v;
        bar.style.width = v + '%';
        if (p < 1) requestAnimationFrame(tick);
        else setTimeout(finish, 250);
    };
    requestAnimationFrame(tick);
})();

// ===== Thème =====
$('#theme-toggle').addEventListener('click', () => {
    const root = document.documentElement;
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
});

// ===== En-tête + barre de progression =====
const header = $('#header');
const progress = $('#progress');
let lastY = window.scrollY;

function onScroll() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    header.classList.toggle('scrolled', y > 30);
    const menuOpen = $('#mobile-menu').classList.contains('open');
    header.classList.toggle('hidden', !menuOpen && y > lastY && y > 400);
    lastY = y;
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ===== Menu mobile =====
const burger = $('#burger');
const mobileMenu = $('#mobile-menu');

function setMenu(open) {
    mobileMenu.classList.toggle('open', open);
    mobileMenu.setAttribute('aria-hidden', String(!open));
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    document.body.style.overflow = open ? 'hidden' : '';
}
burger.addEventListener('click', () => setMenu(!mobileMenu.classList.contains('open')));
$$('a', mobileMenu).forEach(a => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

// ===== Lien actif =====
const navLinks = $$('.nav-link');
const navObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(l => l.classList.toggle('active', l.hash === '#' + entry.target.id));
    });
}, { rootMargin: '-45% 0px -50% 0px' });
$$('main section[id]').forEach(s => navObserver.observe(s));

// ===== Apparitions =====
const revealObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        obs.unobserve(entry.target);
    });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

$$('.reveal').forEach(el => {
    const group = $$(':scope > .reveal', el.parentElement);
    if (group.length > 1) el.style.transitionDelay = (group.indexOf(el) % 6) * 80 + 'ms';
    revealObserver.observe(el);
});

// ===== Compteurs =====
const counterObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = +el.dataset.count;
        const start = performance.now();
        const tick = now => {
            const p = Math.min((now - start) / 1800, 1);
            el.textContent = Math.round(target * (1 - Math.pow(1 - p, 4)));
            if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        obs.unobserve(el);
    });
}, { threshold: 0.5 });
$$('[data-count]').forEach(el => counterObserver.observe(el));

// ===== Curseur personnalisé =====
if (finePointer && !reduceMotion) {
    const cursor = $('#cursor');
    const label = $('#cursor-label');
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;

    window.addEventListener('mousemove', e => {
        x = e.clientX; y = e.clientY;
        cursor.classList.add('visible');
    });
    document.addEventListener('mouseleave', () => cursor.classList.remove('visible'));

    (function follow() {
        cx += (x - cx) * 0.2;
        cy += (y - cy) * 0.2;
        cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
        requestAnimationFrame(follow);
    })();

    $$('a, button, label, [data-cursor]').forEach(el => {
        el.addEventListener('mouseenter', () => {
            if (el.dataset.cursor) {
                label.textContent = el.dataset.cursor;
                cursor.classList.add('label');
            } else {
                cursor.classList.add('hover');
            }
        });
        el.addEventListener('mouseleave', () => cursor.classList.remove('hover', 'label'));
    });
}

// ===== Boutons magnétiques =====
if (finePointer && !reduceMotion) {
    $$('.magnetic').forEach(el => {
        el.addEventListener('mousemove', e => {
            const r = el.getBoundingClientRect();
            const dx = e.clientX - (r.left + r.width / 2);
            const dy = e.clientY - (r.top + r.height / 2);
            el.style.transform = `translate(${dx * 0.25}px, ${dy * 0.35}px)`;
        });
        el.addEventListener('mouseleave', () => {
            el.style.transition = 'transform .6s cubic-bezier(.16,1,.3,1)';
            el.style.transform = '';
            setTimeout(() => (el.style.transition = ''), 600);
        });
    });
}

// ===== Lumière qui suit la souris sur les cartes =====
$$('.spot').forEach(card => {
    card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', e.clientX - r.left + 'px');
        card.style.setProperty('--my', e.clientY - r.top + 'px');
    });
});

// ===== Inclinaison 3D des visuels de projets =====
if (finePointer && !reduceMotion) {
    $$('.tilt').forEach(el => {
        el.addEventListener('mousemove', e => {
            const r = el.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width - 0.5;
            const py = (e.clientY - r.top) / r.height - 0.5;
            el.style.transform = `perspective(1200px) rotateY(${px * 8}deg) rotateX(${-py * 8}deg)`;
        });
        el.addEventListener('mouseleave', () => (el.style.transform = ''));
    });
}

// ===== Photo : initiales si l'image est absente =====
const avatar = $('#avatar-img');
const noImg = () => avatar.parentElement.classList.add('no-img');
avatar.addEventListener('error', noImg);
if (avatar.complete && avatar.naturalWidth === 0) noImg();

// ===== Notification =====
const toast = $('#toast');
let toastTimer;
function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

// ===== Copier l'email =====
const copyBtn = $('#copy-email');
copyBtn.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(copyBtn.dataset.email);
        showToast('Adresse copiée ✓');
        const label = $('span', copyBtn);
        copyBtn.classList.add('copied');
        label.textContent = 'Copiée !';
        setTimeout(() => { copyBtn.classList.remove('copied'); label.textContent = "Copier l'adresse"; }, 2000);
    } catch (e) {
        showToast(copyBtn.dataset.email);
    }
});

// ===== Formulaire de contact (envoi réel via FormSubmit) =====
const form = $('#contact-form');
const submitBtn = $('#submit-btn');
const formAlert = $('#form-alert');
const success = $('#form-success');
const msgCount = $('#msg-count');
const MAIL = 'konanrilydiegrace@gmail.com';

const rules = {
    nom: v => v.length >= 2 || 'Indiquez votre nom (2 caractères minimum).',
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || 'Adresse email invalide.',
    message: v => v.length >= 10 || 'Votre message doit contenir au moins 10 caractères.'
};

function validate(name, showError = true) {
    const input = form.elements[name];
    const result = rules[name](input.value.trim());
    const field = input.closest('.field');
    const err = $('#err-' + name);
    const ok = result === true;
    if (showError) {
        field.classList.toggle('error', !ok);
        err.textContent = ok ? '' : result;
    }
    field.classList.toggle('valid', ok);
    input.setAttribute('aria-invalid', String(!ok));
    return ok;
}

Object.keys(rules).forEach(name => {
    const input = form.elements[name];
    input.setAttribute('aria-describedby', 'err-' + name);
    input.addEventListener('blur', () => { if (input.value.trim()) validate(name); });
    input.addEventListener('input', () => {
        if (input.closest('.field').classList.contains('error')) validate(name);
        else validate(name, false);
    });
});

form.elements.message.addEventListener('input', e => {
    const n = e.target.value.length;
    msgCount.textContent = n;
    msgCount.parentElement.classList.toggle('warn', n > 1350);
});

function mailtoLink() {
    const d = new FormData(form);
    const subject = `${d.get('sujet')} — ${d.get('nom') || ''}`;
    const body = `${d.get('message') || ''}\n\n— ${d.get('nom') || ''}\n${d.get('email') || ''}\n${d.get('organisation') || ''}`;
    return `mailto:${MAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

form.addEventListener('submit', async e => {
    e.preventDefault();
    formAlert.hidden = true;

    const results = Object.keys(rules).map(n => validate(n));
    if (results.includes(false)) {
        form.querySelector('.field.error input, .field.error textarea').focus();
        return;
    }
    // Robot détecté (champ caché rempli) : on fait semblant que tout va bien
    if (form.elements._honey.value) { showSuccess(); return; }

    const data = new FormData(form);
    data.append('_subject', `Portfolio — ${data.get('sujet')} — ${data.get('nom')}`);
    data.append('_replyto', data.get('email'));

    submitBtn.classList.add('loading');
    $('.submit-text', submitBtn).textContent = 'Envoi en cours…';

    try {
        const res = await fetch(`https://formsubmit.co/ajax/${MAIL}`, {
            method: 'POST',
            headers: { Accept: 'application/json' },
            body: data
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || String(json.success) !== 'true') throw new Error(json.message || 'Erreur');
        showSuccess();
    } catch (err) {
        formAlert.innerHTML = `L'envoi n'a pas pu aboutir. Vérifiez votre connexion ou
            <a href="${mailtoLink()}">envoyez-le depuis votre messagerie</a>.`;
        formAlert.hidden = false;
    } finally {
        submitBtn.classList.remove('loading');
        $('.submit-text', submitBtn).textContent = 'Envoyer le message';
    }
});

function showSuccess() {
    $('#success-name').textContent = form.elements.nom.value.trim().split(' ')[0];
    success.hidden = false;
    success.focus();
    showToast('Message envoyé ✓');
}

$('#send-another').addEventListener('click', () => {
    form.reset();
    msgCount.textContent = '0';
    $$('.field', form).forEach(f => f.classList.remove('valid', 'error'));
    $$('.field-error', form).forEach(el => (el.textContent = ''));
    success.hidden = true;
    form.elements.nom.focus();
});

// ===== Année =====
const year = new Date().getFullYear();
$('#year').textContent = year;
$('#year-hero').textContent = year;

// ===== Horloge du pied de page =====
const clock = $('#clock');
const updateClock = () => {
    clock.textContent = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};
updateClock();
setInterval(updateClock, 30000);
