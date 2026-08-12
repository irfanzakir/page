(function () {
  const track = document.getElementById('track');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const dotsWrap = document.getElementById('dots');
  const carousel = document.getElementById('carousel');
  
  let index = 0;
  let dots = [];
  let mediaCache = {}; // Cache for media elements: { slideIndex: { img, video } }
  let updateTimeout = null;

  const IMAGE_EXT = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  const VIDEO_EXT = ['mp4', 'webm', 'mov'];

  function extOf(name) {
    const parts = name.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
  }

  async function loadManifest() {
    try {
      // Removed cache-busting query parameter for better HTTP caching
      const res = await fetch('images/manifest.json', { cache: 'default' });
      if (!res.ok) throw new Error('manifest not found');
      const files = await res.json();

      return files.filter((name) => {
        const lower = name.toLowerCase();
        if (lower.startsWith('profile.')) return false;
        if (lower === 'manifest.json') return false;
        const ext = extOf(lower);
        return IMAGE_EXT.includes(ext) || VIDEO_EXT.includes(ext);
      });
    } catch (e) {
      console.warn('Could not load images/manifest.json, falling back to minimal showcase.', e);
      return ['profile.png'];
    }
  }

  // IntersectionObserver for lazy-loading media
  const io = ('IntersectionObserver' in window) ? new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      
      const slide = entry.target;
      const slideIndex = Array.from(track.children).indexOf(slide);
      const cached = mediaCache[slideIndex];
      
      if (!cached) return;

      // Load image if needed
      if (cached.img && cached.img.dataset.src && !cached.img.src) {
        cached.img.src = cached.img.dataset.src;
        cached.img.removeAttribute('data-src');
      }

      // Load video if needed
      if (cached.video && cached.video.dataset.src && !cached.video.src) {
        cached.video.src = cached.video.dataset.src;
        cached.video.load();
        cached.video.removeAttribute('data-src');
      }

      // Unobserve after load to free memory
      io.unobserve(slide);
    });
  }, { root: carousel, threshold: 0.25 }) : null;

  function buildSlides(files) {
    track.innerHTML = '';
    mediaCache = {};
    
    if (files.length === 0) {
      track.innerHTML = '<div class="slide">No showcase items yet</div>';
      return;
    }

    files.forEach((name, slideIndex) => {
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
        
        // Cache media element reference
        mediaCache[slideIndex] = { video, img: null };
      } else {
        const img = document.createElement('img');
        img.setAttribute('data-src', 'images/' + encodeURIComponent(name));
        img.loading = 'lazy';
        img.alt = name;
        slide.appendChild(img);
        
        // Cache media element reference
        mediaCache[slideIndex] = { img, video: null };
      }

      track.appendChild(slide);

      if (io) io.observe(slide);
    });
  }

  function buildDots(count) {
    dotsWrap.innerHTML = '';
    dots = [];
    for (let i = 0; i < count; i++) {
      const dot = document.createElement('button');
      dot.className = 'dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
      dot.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(dot);
      dots.push(dot);
    }
  }

  function update() {
    // Clear any pending updates
    if (updateTimeout) clearTimeout(updateTimeout);
    
    track.style.transform = 'translateX(-' + (index * 100) + '%)';
    
    // Update dots
    dots.forEach((d, i) => d.classList.toggle('active', i === index));

    // Update media: ensure active slide is loaded, pause others
    const slides = track.querySelectorAll('.slide');
    slides.forEach((slide, i) => {
      const cached = mediaCache[i];
      if (!cached) return;
      
      const { img, video } = cached;

      // Load active slide's media immediately
      if (i === index) {
        if (img && img.dataset?.src && !img.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        }
        if (video && video.dataset?.src && !video.src) {
          video.src = video.dataset.src;
          video.load();
          video.removeAttribute('data-src');
        }
      }

      // Video playback management: only control active video
      if (video) {
        if (i === index) {
          // Defer playback to avoid jank during animation
          updateTimeout = setTimeout(() => {
            video.play().catch(() => {
              // Autoplay may be blocked, silently fail
            });
          }, 350); // Match transition duration
        } else {
          // Only pause if currently playing
          if (!video.paused) {
            video.pause();
            video.currentTime = 0;
          }
        }
      }
    });
  }

  function goTo(i) {
    const slideCount = track.children.length;
    if (slideCount === 0) return;
    index = (i + slideCount) % slideCount;
    update();
  }

  // Navigation buttons with event delegation approach
  prevBtn.addEventListener('click', () => goTo(index - 1));
  nextBtn.addEventListener('click', () => goTo(index + 1));

  // Touch swipe handling
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
  }, { passive: true }); // Mark as passive for performance

  // Mouse drag handling (desktop)
  let mouseStartX = 0;
  let mouseDown = false;

  carousel.addEventListener('mousedown', (e) => {
    mouseStartX = e.clientX;
    mouseDown = true;
  });

  // Use capture phase to improve efficiency
  document.addEventListener('mouseup', (e) => {
    if (!mouseDown) return;
    const diff = e.clientX - mouseStartX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) goTo(index - 1);
      else goTo(index + 1);
    }
    mouseDown = false;
  }, true);

  // Keyboard navigation
  carousel.setAttribute('tabindex', '0');
  carousel.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') goTo(index - 1);
    if (e.key === 'ArrowRight') goTo(index + 1);
  });

  // Initialize carousel
  (async function init() {
    const files = await loadManifest();
    buildSlides(files);
    buildDots(files.length);

    // Ensure first slide's media is loaded immediately (visible content)
    if (files.length > 0) {
      const cached = mediaCache[0];
      if (cached) {
        if (cached.img) {
          cached.img.src = cached.img.dataset.src;
          cached.img.removeAttribute('data-src');
        }
        if (cached.video) {
          cached.video.src = cached.video.dataset.src;
          cached.video.load();
          cached.video.removeAttribute('data-src');
        }
      }
    }

    update();
  })();
})();
