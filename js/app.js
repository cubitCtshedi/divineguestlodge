/*! Divine Guest Lodge — © 2026 Divine Guest Lodge. All rights reserved.
 *  Designed & built by Heshtech (https://heshtech.co.za).
 *  Unauthorised reproduction or redistribution of this script is prohibited.
 *  Build: DGL-2026-HESHTECH */
(function(){
  'use strict';
  if (typeof document === 'undefined') return;

  // Respect reduced-motion preference (used throughout)
  var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // -------- Same-origin image guard (defence in depth) --------
  function isSafeImageURL(url){
    if (typeof url !== 'string' || url.length > 600) return false;
    try {
      var u = new URL(url, window.location.href);
      return u.origin === window.location.origin;
    } catch(e){ return false; }
  }

  // -------- Lazy background image loader --------
  // Decodes images off the main thread when supported, then fades in.
  function loadBg(el){
    if (!el) return;
    var url = el.getAttribute('data-bg');
    if (!url || !isSafeImageURL(url)) {
      el.removeAttribute('data-bg');
      return;
    }
    var img = new Image();
    var safeUrl = url.replace(/"/g, '%22');
    var apply = function(){
      el.style.backgroundImage = 'url("' + safeUrl + '")';
      el.classList.add('bg-loaded');
      el.removeAttribute('data-bg');
    };
    var fail = function(){ el.removeAttribute('data-bg'); };
    img.onload = function(){
      // Use decode() if available for off-thread decoding
      if (typeof img.decode === 'function') {
        img.decode().then(apply).catch(apply);
      } else {
        apply();
      }
    };
    img.onerror = fail;
    img.src = url;
  }

  if ('IntersectionObserver' in window) {
    var bgIO = new IntersectionObserver(function(entries){
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          loadBg(entries[i].target);
          bgIO.unobserve(entries[i].target);
        }
      }
    }, { rootMargin: '300px 0px', threshold: 0.01 });
    var lazyEls = document.querySelectorAll('[data-bg]');
    for (var li = 0; li < lazyEls.length; li++) bgIO.observe(lazyEls[li]);
  } else {
    // No IO support — load all immediately so users still see images
    var allLazy = document.querySelectorAll('[data-bg]');
    for (var ai = 0; ai < allLazy.length; ai++) loadBg(allLazy[ai]);
  }

  // -------- Sticky nav state on scroll --------
  var nav = document.getElementById('mainNav');
  function onScroll(){
    if (!nav) return;
    if (window.scrollY > 30) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // -------- Mobile menu toggle --------
  var toggle = document.getElementById('navToggle');
  if (toggle && nav) {
    toggle.addEventListener('click', function(){
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    var navAs = document.querySelectorAll('#navLinks a');
    for (var i = 0; i < navAs.length; i++) {
      navAs[i].addEventListener('click', function(){
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    }
  }

  // -------- Scroll-reveal --------
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function(entries){
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          entries[i].target.classList.add('in');
          io.unobserve(entries[i].target);
        }
      }
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
    var targets = document.querySelectorAll('.reveal, .reveal-stagger');
    for (var j = 0; j < targets.length; j++) io.observe(targets[j]);
  } else {
    var fb = document.querySelectorAll('.reveal, .reveal-stagger');
    for (var k = 0; k < fb.length; k++) fb[k].classList.add('in');
  }

  // ============================================================
  // ROOMS: AUTO-ROTATING SLIDESHOW + LIGHTBOX
  // ============================================================
  var feature      = document.getElementById('roomFeature');
  var slideshowEl  = document.getElementById('gallerySlideshow');
  var dotsEl       = document.getElementById('gsDots');
  var titleEl      = document.getElementById('roomTitle');
  var descEl       = document.getElementById('roomDesc');
  var bedEl        = document.querySelector('[data-bed-label]');
  var priceEl      = document.getElementById('roomPriceNum');
  var suffixEl     = document.getElementById('roomPriceSuffix');
  var tagEl        = document.getElementById('roomTag');
  var listEl       = document.getElementById('roomsList');
  var phTpl        = document.getElementById('gsPlaceholderTpl');
  var lbPhTpl      = document.getElementById('lbPlaceholderTpl');

  // Lightbox refs
  var lightbox       = document.getElementById('lightbox');
  var lbImage        = document.getElementById('lbImage');
  var lbCaption      = document.getElementById('lbCaption');
  var lbCounterCur   = lightbox && lightbox.querySelector('.lb-counter-current');
  var lbCounterTotal = document.getElementById('lbCounterTotal');
  var lbClose        = document.getElementById('lbClose');
  var lbPrev         = document.getElementById('lbPrev');
  var lbNext         = document.getElementById('lbNext');

  if (feature && listEl && slideshowEl) {

    // Slideshow state for the currently displayed room
    var ss = {
      collection: [],   // array of url strings (empty string => placeholder)
      collectionName: '',
      slides: [],       // DOM nodes
      activeIndex: 0,
      timer: null,
      intervalMs: 4500,
      paused: false
    };

    function clearTimer(){
      if (ss.timer) {
        window.clearInterval(ss.timer);
        ss.timer = null;
      }
    }
    function startTimer(){
      clearTimer();
      if (prefersReduced) return;       // respect motion preferences
      if (ss.collection.length < 2) return; // no rotation needed for single image
      ss.timer = window.setInterval(function(){
        if (!ss.paused && !lbState.open) advance(1);
      }, ss.intervalMs);
    }

    function buildPlaceholderSlide(index, total, collectionName){
      if (!phTpl || !phTpl.content) return null;
      var clone = phTpl.content.firstElementChild.cloneNode(true);
      var coll  = clone.querySelector('[data-ph-collection]');
      var num   = clone.querySelector('[data-ph-num]');
      if (coll) coll.textContent = collectionName + ' Collection';
      if (num)  num.textContent  = pad2(index + 1) + ' / ' + pad2(total);
      return clone;
    }

    function pad2(n){ return n < 10 ? '0' + n : '' + n; }

    function buildSlide(item, index, total, collectionName){
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'gs-slide';
      btn.setAttribute('data-gs-index', String(index));
      btn.setAttribute('aria-label',
        'View ' + collectionName + ' image ' + (index + 1) + ' of ' + total);
      btn.setAttribute('tabindex', '-1'); // only the active slide is reachable

      if (typeof item === 'string' && item.length > 0 && isSafeImageURL(item)) {
        var safeUrl = item.replace(/"/g, '%22');
        btn.style.backgroundImage = 'url("' + safeUrl + '")';
      } else {
        // Empty string / no URL → render placeholder
        var ph = buildPlaceholderSlide(index, total, collectionName);
        if (ph) btn.appendChild(ph);
      }
      return btn;
    }

    function parseGallery(card){
      var raw = card.getAttribute('data-gallery');
      if (!raw) return [];
      try {
        var arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr : [];
      } catch(e) {
        return [];
      }
    }

    function renderDots(total){
      if (!dotsEl) return;
      // Clear existing
      while (dotsEl.firstChild) dotsEl.removeChild(dotsEl.firstChild);
      if (total < 2) return; // no dots if only one slide

      for (var i = 0; i < total; i++) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'gs-dot';
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
        dot.setAttribute('data-dot-index', String(i));
        if (i === 0) {
          dot.classList.add('is-active');
          dot.setAttribute('aria-selected', 'true');
        } else {
          dot.setAttribute('aria-selected', 'false');
        }
        dotsEl.appendChild(dot);
      }
    }

    function loadGallery(card){
      if (!card) return;
      var collection = parseGallery(card);
      var collectionName = card.getAttribute('data-title') || 'Room';

      // Fallback: if no gallery defined, use the single data-image
      if (collection.length === 0) {
        var single = card.getAttribute('data-image') || '';
        collection = [single];
      }

      // Clear current slides + timer
      clearTimer();
      while (slideshowEl.firstChild) slideshowEl.removeChild(slideshowEl.firstChild);

      // Build new slides
      ss.collection = collection;
      ss.collectionName = collectionName;
      ss.slides = [];
      for (var i = 0; i < collection.length; i++) {
        var slide = buildSlide(collection[i], i, collection.length, collectionName);
        if (i === 0) {
          slide.classList.add('is-active');
          slide.setAttribute('tabindex', '0');
        }
        slideshowEl.appendChild(slide);
        ss.slides.push(slide);
      }

      ss.activeIndex = 0;
      renderDots(collection.length);
      startTimer();
    }

    function showSlide(newIndex){
      if (!ss.slides.length) return;
      // Wrap around
      var len = ss.slides.length;
      newIndex = ((newIndex % len) + len) % len;
      if (newIndex === ss.activeIndex) return;

      var oldSlide = ss.slides[ss.activeIndex];
      var newSlide = ss.slides[newIndex];

      if (oldSlide) {
        oldSlide.classList.remove('is-active');
        oldSlide.setAttribute('tabindex', '-1');
      }
      if (newSlide) {
        newSlide.classList.add('is-active');
        newSlide.setAttribute('tabindex', '0');
      }

      // Update dots
      if (dotsEl) {
        var allDots = dotsEl.querySelectorAll('.gs-dot');
        for (var i = 0; i < allDots.length; i++) {
          allDots[i].classList.toggle('is-active', i === newIndex);
          allDots[i].setAttribute('aria-selected', i === newIndex ? 'true' : 'false');
        }
      }

      ss.activeIndex = newIndex;
    }

    function advance(direction){
      showSlide(ss.activeIndex + direction);
    }

    // Pause on hover (so users can read content without slides changing)
    if (feature) {
      feature.addEventListener('mouseenter', function(){ ss.paused = true; });
      feature.addEventListener('mouseleave', function(){ ss.paused = false; });
    }

    // Click a slide → open lightbox at that index
    slideshowEl.addEventListener('click', function(ev){
      var slide = ev.target.closest('.gs-slide');
      if (!slide || !slideshowEl.contains(slide)) return;
      ev.preventDefault();
      var idx = parseInt(slide.getAttribute('data-gs-index'), 10) || 0;
      openLightbox(idx);
    });

    // Click a dot → jump to that slide
    if (dotsEl) {
      dotsEl.addEventListener('click', function(ev){
        var dot = ev.target.closest('.gs-dot');
        if (!dot) return;
        ev.preventDefault();
        var idx = parseInt(dot.getAttribute('data-dot-index'), 10) || 0;
        showSlide(idx);
        // Reset timer so user gets full interval after their interaction
        startTimer();
      });
    }

    // ============================================================
    // LIGHTBOX
    // ============================================================
    var lbState = {
      open: false,
      index: 0,
      lastFocus: null
    };

    function renderLightboxImage(idx){
      if (!lbImage) return;
      lbImage.classList.add('is-changing');

      // Clear existing content
      while (lbImage.firstChild) lbImage.removeChild(lbImage.firstChild);
      lbImage.style.backgroundImage = '';

      window.setTimeout(function(){
        var item = ss.collection[idx];
        if (typeof item === 'string' && item.length > 0 && isSafeImageURL(item)) {
          // Real image: set as background of lb-image
          var safeUrl = item.replace(/"/g, '%22');
          lbImage.style.backgroundImage = 'url("' + safeUrl + '")';
        } else {
          // Placeholder
          if (lbPhTpl && lbPhTpl.content) {
            var clone = lbPhTpl.content.firstElementChild.cloneNode(true);
            var collEl = clone.querySelector('[data-ph-collection]');
            var numEl  = clone.querySelector('[data-ph-num]');
            if (collEl) collEl.textContent = ss.collectionName + ' Collection';
            if (numEl)  numEl.textContent  = pad2(idx + 1) + ' / ' + pad2(ss.collection.length);
            lbImage.appendChild(clone);
          }
        }

        // Update counter & caption
        if (lbCounterCur)   lbCounterCur.textContent   = String(idx + 1);
        if (lbCounterTotal) lbCounterTotal.textContent = String(ss.collection.length);
        if (lbCaption) {
          lbCaption.textContent = ss.collectionName + ' — Image ' + (idx + 1);
        }
        // Update aria-label of the live region
        lbImage.setAttribute('aria-label',
          ss.collectionName + ' image ' + (idx + 1) + ' of ' + ss.collection.length);

        lbImage.classList.remove('is-changing');
      }, 180);
    }

    function openLightbox(startIdx){
      if (!lightbox || lbState.open) return;
      lbState.open = true;
      lbState.index = Math.max(0, Math.min(startIdx || 0, ss.collection.length - 1));
      lbState.lastFocus = document.activeElement;

      lightbox.removeAttribute('hidden');
      // Force reflow before adding is-open so transition triggers
      // eslint-disable-next-line no-unused-expressions
      lightbox.offsetHeight;
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.classList.add('lightbox-locked');

      renderLightboxImage(lbState.index);

      // Focus the close button so keyboard users start there
      window.setTimeout(function(){
        if (lbClose) lbClose.focus();
      }, 80);
    }

    function closeLightbox(){
      if (!lightbox || !lbState.open) return;
      lbState.open = false;
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('lightbox-locked');

      // Hide after transition completes
      window.setTimeout(function(){
        if (!lbState.open) lightbox.setAttribute('hidden', '');
      }, 400);

      // Return focus to whatever opened the lightbox
      if (lbState.lastFocus && typeof lbState.lastFocus.focus === 'function') {
        try { lbState.lastFocus.focus(); } catch(e) {}
      }
    }

    function lbAdvance(direction){
      if (!ss.collection.length) return;
      var len = ss.collection.length;
      lbState.index = ((lbState.index + direction) % len + len) % len;
      renderLightboxImage(lbState.index);
    }

    if (lbClose) lbClose.addEventListener('click', closeLightbox);
    if (lbPrev)  lbPrev.addEventListener('click', function(){ lbAdvance(-1); });
    if (lbNext)  lbNext.addEventListener('click', function(){ lbAdvance(1); });

    // Click on dimmed background closes lightbox
    if (lightbox) {
      lightbox.addEventListener('click', function(ev){
        if (ev.target === lightbox) closeLightbox();
      });
    }

    // Keyboard: ESC closes, ←/→ navigates
    document.addEventListener('keydown', function(ev){
      if (!lbState.open) return;
      if (ev.key === 'Escape') {
        ev.preventDefault();
        closeLightbox();
      } else if (ev.key === 'ArrowLeft') {
        ev.preventDefault();
        lbAdvance(-1);
      } else if (ev.key === 'ArrowRight') {
        ev.preventDefault();
        lbAdvance(1);
      } else if (ev.key === 'Tab') {
        // Simple focus trap: keep tab within lightbox controls
        var focusables = [lbClose, lbPrev, lbNext].filter(Boolean);
        if (!focusables.length) return;
        var idx = focusables.indexOf(document.activeElement);
        if (ev.shiftKey) {
          if (idx <= 0) {
            ev.preventDefault();
            focusables[focusables.length - 1].focus();
          }
        } else {
          if (idx === focusables.length - 1) {
            ev.preventDefault();
            focusables[0].focus();
          }
        }
      }
    });

    // ============================================================
    // ROOM SWAP (now also swaps the gallery)
    // ============================================================
    function setRoom(card){
      if (!card || card.classList.contains('active')) return;
      var data = {
        title:  card.getAttribute('data-title')  || '',
        desc:   card.getAttribute('data-desc')   || '',
        bed:    card.getAttribute('data-bed')    || '',
        price:  card.getAttribute('data-price')  || '',
        suffix: card.getAttribute('data-suffix') || '',
        tag:    card.getAttribute('data-tag')    || ''
      };

      feature.classList.add('is-swapping');
      window.setTimeout(function(){
        if (titleEl)  titleEl.textContent  = data.title;
        if (descEl)   descEl.textContent   = data.desc;
        if (bedEl)    bedEl.textContent    = data.bed;
        if (priceEl)  priceEl.textContent  = data.price;
        if (suffixEl) suffixEl.textContent = data.suffix;

        if (tagEl) {
          if (data.tag) {
            tagEl.textContent = data.tag;
            tagEl.classList.remove('is-empty');
          } else {
            tagEl.classList.add('is-empty');
          }
        }

        // Re-trigger amenity stagger animation
        var amens = document.getElementById('roomAmenities');
        if (amens) {
          var children = amens.children;
          for (var c = 0; c < children.length; c++) {
            children[c].style.animation = 'none';
            // eslint-disable-next-line no-unused-expressions
            children[c].offsetHeight;
            children[c].style.animation = '';
          }
        }
        if (priceEl) {
          priceEl.classList.remove('flash');
          // eslint-disable-next-line no-unused-expressions
          priceEl.offsetWidth;
          priceEl.classList.add('flash');
        }

        // Update sidebar active state
        var siblings = listEl.querySelectorAll('.room-card');
        for (var s = 0; s < siblings.length; s++) {
          siblings[s].classList.remove('active');
          siblings[s].setAttribute('aria-pressed', 'false');
        }
        card.classList.add('active');
        card.setAttribute('aria-pressed', 'true');

        // Swap the gallery slideshow to this room's collection
        loadGallery(card);

        feature.classList.remove('is-swapping');
      }, 280);
    }

    // Click a sidebar room card → swap room
    listEl.addEventListener('click', function(ev){
      var btn = ev.target.closest('.room-card');
      if (!btn || !listEl.contains(btn)) return;
      ev.preventDefault();
      setRoom(btn);
    });

    // Initial load: build the active room's gallery once the rooms
    // section enters the viewport (saves bandwidth on initial paint).
    var initialCard = listEl.querySelector('.room-card.active');
    function initRoomsGallery(){
      if (initialCard) loadGallery(initialCard);
    }
    if ('IntersectionObserver' in window) {
      var roomsIO = new IntersectionObserver(function(entries){
        if (entries[0] && entries[0].isIntersecting) {
          initRoomsGallery();
          roomsIO.disconnect();
        }
      }, { rootMargin: '400px 0px' });
      roomsIO.observe(feature);
    } else {
      initRoomsGallery();
    }
  }

  // ============================================================
  // ENHANCED ANIMATION LAYER
  // ============================================================

  // -------- Scroll progress bar --------
  var prog = document.getElementById('scrollProgress');
  if (prog) {
    var ticking = false;
    function updateProgress(){
      var docH = document.documentElement.scrollHeight - window.innerHeight;
      var pct = docH > 0 ? (window.scrollY / docH) * 100 : 0;
      prog.style.width = pct + '%';
      ticking = false;
    }
    window.addEventListener('scroll', function(){
      if (!ticking) {
        window.requestAnimationFrame(updateProgress);
        ticking = true;
      }
    }, { passive: true });
    updateProgress();
  }

  // -------- Floating particles in hero --------
  var heroEl = document.querySelector('.hero');
  if (heroEl && !prefersReduced) {
    var particleCount = window.innerWidth < 768 ? 8 : 16;
    for (var p = 0; p < particleCount; p++) {
      var dot = document.createElement('span');
      dot.className = 'particle';
      var size = 2 + Math.random() * 5;
      dot.style.width = size + 'px';
      dot.style.height = size + 'px';
      dot.style.left = (Math.random() * 100) + '%';
      dot.style.animationDuration = (12 + Math.random() * 14) + 's';
      dot.style.animationDelay = (Math.random() * 12) + 's';
      heroEl.appendChild(dot);
    }
  }

  // -------- Number counters (animate when in view) --------
  function animateCount(el){
    var target = parseFloat(el.getAttribute('data-count-to'));
    var decimals = parseInt(el.getAttribute('data-count-decimals') || '0', 10);
    if (isNaN(target)) return;
    if (prefersReduced) {
      el.textContent = target.toFixed(decimals);
      return;
    }
    var duration = 1600;
    var startT = null;
    function tick(ts){
      if (!startT) startT = ts;
      var t = Math.min((ts - startT) / duration, 1);
      // easeOutCubic
      var eased = 1 - Math.pow(1 - t, 3);
      var val = target * eased;
      el.textContent = val.toFixed(decimals);
      if (t < 1) window.requestAnimationFrame(tick);
      else el.textContent = target.toFixed(decimals);
    }
    window.requestAnimationFrame(tick);
  }

  if ('IntersectionObserver' in window) {
    var counterIO = new IntersectionObserver(function(entries){
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          animateCount(entries[i].target);
          counterIO.unobserve(entries[i].target);
        }
      }
    }, { threshold: 0.5 });
    var counters = document.querySelectorAll('.counter');
    for (var ci = 0; ci < counters.length; ci++) counterIO.observe(counters[ci]);
  } else {
    var fallbackCounters = document.querySelectorAll('.counter');
    for (var fc = 0; fc < fallbackCounters.length; fc++) {
      var f = fallbackCounters[fc];
      var t = parseFloat(f.getAttribute('data-count-to'));
      var d = parseInt(f.getAttribute('data-count-decimals') || '0', 10);
      if (!isNaN(t)) f.textContent = t.toFixed(d);
    }
  }

  // -------- 3D tilt on cards (desktop only, pointer-aware) --------
  function attachTilt(card, maxTilt){
    if (!card) return;
    var raf = null;
    var rect = null;
    function onMove(e){
      if (!rect) rect = card.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width;
      var y = (e.clientY - rect.top) / rect.height;
      var rx = (0.5 - y) * maxTilt;
      var ry = (x - 0.5) * maxTilt;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function(){
        card.style.transform = 'perspective(900px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) translateY(-6px)';
      });
    }
    function onEnter(){ rect = card.getBoundingClientRect(); }
    function onLeave(){
      if (raf) cancelAnimationFrame(raf);
      card.style.transform = '';
      rect = null;
    }
    card.addEventListener('mouseenter', onEnter);
    card.addEventListener('mousemove', onMove);
    card.addEventListener('mouseleave', onLeave);
  }
  // Only enable tilt on devices with fine pointer (mouse/trackpad)
  var hasFinePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
  if (hasFinePointer && !prefersReduced) {
    var whyCards = document.querySelectorAll('.why-card');
    for (var w = 0; w < whyCards.length; w++) attachTilt(whyCards[w], 6);
    var galleryItems = document.querySelectorAll('.gallery-grid > div');
    for (var g = 0; g < galleryItems.length; g++) attachTilt(galleryItems[g], 4);
  }

  // -------- Magnetic button effect (desktop pointer only) --------
  function attachMagnetic(btn){
    if (!btn) return;
    var raf2 = null;
    btn.addEventListener('mousemove', function(e){
      var r = btn.getBoundingClientRect();
      var x = e.clientX - r.left - r.width / 2;
      var y = e.clientY - r.top - r.height / 2;
      if (raf2) cancelAnimationFrame(raf2);
      raf2 = requestAnimationFrame(function(){
        btn.style.transform = 'translate(' + (x * 0.18).toFixed(1) + 'px,' + (y * 0.18).toFixed(1) + 'px)';
      });
    });
    btn.addEventListener('mouseleave', function(){
      if (raf2) cancelAnimationFrame(raf2);
      btn.style.transform = '';
    });
  }
  if (hasFinePointer && !prefersReduced) {
    var heroBtns = document.querySelectorAll('.hero-cta .btn, .cta-inner .btn');
    for (var hb = 0; hb < heroBtns.length; hb++) attachMagnetic(heroBtns[hb]);
  }

  // -------- Hero background parallax --------
  var heroBgEl = document.querySelector('.hero-bg');
  if (heroBgEl && !prefersReduced) {
    var parallaxTicking = false;
    function updateParallax(){
      var sy = window.scrollY;
      if (sy < window.innerHeight * 1.2) {
        heroBgEl.style.setProperty('--hero-y', (sy * 0.25).toFixed(1));
      }
      parallaxTicking = false;
    }
    window.addEventListener('scroll', function(){
      if (!parallaxTicking) {
        window.requestAnimationFrame(updateParallax);
        parallaxTicking = true;
      }
    }, { passive: true });
  }
})();
