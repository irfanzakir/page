(function () {
  const track = document.getElementById('track');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const dotsWrap = document.getElementById('dots');
  const carousel = document.getElementById('carousel');
  let slides = [];
  let dots = [];
  let index = 0;

  const IMAGE_EXT = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  const VIDEO_EXT = ['mp4', 'webm', 'mov'];

  function extOf(name) {
    const parts = name.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
  }

  async function loadManifest() {
    try {
      const res = await fetch('images/manifest.json?v=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) throw new Error('manifest not found');
      const files = await res.json();

      // Exclude the profile picture and the manifest file itself from the showcase
      return files.filter((name) => {
        const lower = name.toLowerCase();
        if (lower.startsWith('profile.')) return false;
        if (lower === 'manifest.json') return false;
        const ext = extOf(lower);
        return IMAGE_EXT.includes(ext) || VIDEO_EXT.includes(ext);
      });
    } catch (e) {
      // Fallback behaviour: manifest failed to load — show profile as a minimal fallback
      console.warn('Could not load images/manifest.json, falling back to minimal showcase.', e);
      // Return at least the profile image which is known to be present in the repo
      return ['profile.png'];
    }
  }

  // IntersectionObserver used to lazy-load media when slide enters viewport
  const io = ('IntersectionObserver' in window) ? new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const slide = entry.target;
      const img = slide.querySelector('img[data-src]');
      const vid = slide.querySelector('video[data-src]');

      if (img && img.dataset.src && !img.src) {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      }

      if (vid && vid.dataset.src && !vid.src) {
        vid.src = vid.dataset.src;
        vid.load();
        vid.removeAttribute('data-src');
      }

      if (io) io.unobserve(slide);
    });
  }, { root: carousel, threshold: 0.25 }) : null;

  function buildSlides(files) {
    track.innerHTML = '';
    if (files.length === 0) {
      track.innerHTML = '<div class="slide">No showcase items yet</div>';
      return;
    }

    files.forEach((name) => {
      const ext = extOf(name);
      const slide = document.createElement('div');
      slide.className = 'slide';

      if (VIDEO_EXT.includes(ext)) {
        const video = document.createElement('video');
        video.setAttribute('data-src', 'images/' + encodeURIComponent(name));
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.preload = 'none';
        slide.appendChild(video);
      } else {
        const img = document.createElement('img');
        img.setAttribute('data-src', 'images/' + encodeURIComponent(name));
        img.loading = 'lazy';
        img.alt = name;
        slide.appendChild(img);
      }

      track.appendChild(slide);

      if (io) io.observe(slide);
    });
  }

  function buildDots(count) {
    dotsWrap.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const dot = document.createElement('button');
      dot.className = 'dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
      dot.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(dot);
    }
    dots = Array.from(dotsWrap.children);
  }

  function update() {
    track.style.transform = 'translateX(-' + (index * 100) + '%)';
    dots.forEach((d, i) => d.classList.toggle('active', i === index));

    slides.forEach((slide, i) => {
      const img = slide.querySelector('img');
      const video = slide.querySelector('video');

      // Ensure the active slide's media is loaded (navigation fallback and IO fallback)
      if (i === index) {
        if (img && img.dataset && img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        }
        if (video && video.dataset && video.dataset.src) {
          video.src = video.dataset.src;
          video.removeAttribute('data-src');
          video.load();
        }
      }

      if (video) {
        if (i === index) {
          video.play().catch(() => {});
        } else {
          try { video.pause(); } catch (e) {}
          try { video.currentTime = 0; } catch (e) {}
        }
      }
    });
  }

  function goTo(i) {
    if (slides.length === 0) return;
    index = (i + slides.length) % slides.length;
    update();
  }

  prevBtn.addEventListener('click', () => goTo(index - 1));
  nextBtn.addEventListener('click', () => goTo(index + 1));

  // touch swipe
  let startX = 0;
  let isDragging = false;

  carousel.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    isDragging = true;
  }, { passive: true });

  carousel.addEventListener('touchend', (e) => {
    if (!isDragging) return;
    const endX = e.changedTouches[0].clientX;
    const diff = endX - startX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) goTo(index - 1);
      else goTo(index + 1);
    }
    isDragging = false;
  });

  // mouse drag (desktop)
  let mouseStartX = 0;
  let mouseDown = false;

  carousel.addEventListener('mousedown', (e) => {
    mouseStartX = e.clientX;
    mouseDown = true;
  });

  window.addEventListener('mouseup', (e) => {
    if (!mouseDown) return;
    const diff = e.clientX - mouseStartX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) goTo(index - 1);
      else goTo(index + 1);
    }
    mouseDown = false;
  });

  // keyboard
  carousel.setAttribute('tabindex', '0');
  carousel.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') goTo(index - 1);
    if (e.key === 'ArrowRight') goTo(index + 1);
  });

  // bootstrap
  (async function init() {
    const files = await loadManifest();
    buildSlides(files);
    slides = Array.from(track.children);
    buildDots(files.length);

    // Ensure the first slide's media is loaded immediately (visible content)
    if (slides[0]) {
      const firstImg = slides[0].querySelector('img[data-src]');
      const firstVid = slides[0].querySelector('video[data-src]');
      if (firstImg) { firstImg.src = firstImg.dataset.src; firstImg.removeAttribute('data-src'); }
      if (firstVid) { firstVid.src = firstVid.dataset.src; firstVid.removeAttribute('data-src'); firstVid.load(); }
    }

    update();
  })();
})();
