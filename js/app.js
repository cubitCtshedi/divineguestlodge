/*! Divine Guest Lodge — © 2026 Divine Guest Lodge. All rights reserved.
 *  Designed & built by Heshtech (https://heshtech.co.za).
 *  Unauthorised reproduction or redistribution of this script is prohibited.
 *  Build: DGL-2026-HESHTECH */
(function(){
  'use strict';
  if (typeof document === 'undefined') return;

  // Footer year — auto-update so the copyright never goes stale
  var footerYearEl = document.getElementById('footerYear');
  if (footerYearEl) footerYearEl.textContent = String(new Date().getFullYear());

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

  // -------- Best-format picker for gallery JPGs --------
  // Async-detect AVIF + WebP support; pickImageFormat() rewrites .jpg URLs
  // to the best variant the browser can decode. If detection hasn't
  // resolved yet, falls back to the original .jpg (graceful).
  var fmtSupport = { avif: false, webp: false };
  (function detectFormats(){
    function probe(dataUrl, key){
      var im = new Image();
      im.onload = im.onerror = function(){
        fmtSupport[key] = (im.width > 0 && im.height > 0);
      };
      im.src = dataUrl;
    }
    // Smallest valid 2x2 AVIF + 1x1 lossless WebP test images.
    probe('data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=', 'avif');
    probe('data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==', 'webp');
  })();

  function pickImageFormat(url){
    if (typeof url !== 'string' || !/\.jpe?g$/i.test(url)) return url;
    if (fmtSupport.avif) return url.replace(/\.jpe?g$/i, '.avif');
    if (fmtSupport.webp) return url.replace(/\.jpe?g$/i, '.webp');
    return url;
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
    // Opt-out for assets that only ship as .jpg (no .avif/.webp variants)
    if (!el.hasAttribute('data-no-fmt')) url = pickImageFormat(url);
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
    }, { threshold: 0.15, rootMargin: '0px 0px -18% 0px' });
    var targets = document.querySelectorAll('.reveal, .reveal-stagger, .reveal-stagger-left, .reveal-stagger-right');
    for (var j = 0; j < targets.length; j++) io.observe(targets[j]);
  } else {
    var fb = document.querySelectorAll('.reveal, .reveal-stagger, .reveal-stagger-left, .reveal-stagger-right');
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
        var safeUrl = pickImageFormat(item).replace(/"/g, '%22');
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

    // Swipe support — drag horizontally to advance/rewind slides.
    // Uses pointer events so it works for both touch and mouse-drag.
    var swipe = { active:false, startX:0, startY:0, suppressClick:false };
    var SWIPE_THRESHOLD = 45;  // minimum horizontal travel (px)
    var SWIPE_RATIO     = 1.4; // |dx| must beat |dy| by this ratio (filters out vertical scroll)

    slideshowEl.addEventListener('pointerdown', function(ev){
      if (ev.pointerType === 'mouse' && ev.button !== 0) return;
      swipe.active = true;
      swipe.startX = ev.clientX;
      swipe.startY = ev.clientY;
      swipe.suppressClick = false;
    });
    slideshowEl.addEventListener('pointermove', function(ev){
      if (!swipe.active) return;
      if (Math.abs(ev.clientX - swipe.startX) > 8) ss.paused = true;
    });
    function endSwipe(ev){
      if (!swipe.active) return;
      swipe.active = false;
      var dx = ev.clientX - swipe.startX;
      var dy = ev.clientY - swipe.startY;
      if (Math.abs(dx) >= SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy) * SWIPE_RATIO) {
        swipe.suppressClick = true;     // don't open lightbox on the trailing click
        advance(dx < 0 ? 1 : -1);
        startTimer();                   // reset auto-rotate after manual nav
      }
      ss.paused = false;
    }
    slideshowEl.addEventListener('pointerup', endSwipe);
    slideshowEl.addEventListener('pointercancel', function(){
      swipe.active = false; ss.paused = false;
    });
    // Capture-phase click-killer: if a swipe just happened, eat the click that follows
    slideshowEl.addEventListener('click', function(ev){
      if (swipe.suppressClick) {
        ev.stopPropagation();
        ev.preventDefault();
        swipe.suppressClick = false;
      }
    }, true);

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
          var safeUrl = pickImageFormat(item).replace(/"/g, '%22');
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

    // Mobile breakpoint helper (matches @media(max-width:880px) in CSS)
    var mobileMQ = window.matchMedia('(max-width:880px)');
    function isMobile(){ return mobileMQ.matches; }

    // Read-more / collapsible details (mobile-only) ===============
    var content    = feature.querySelector('.room-feature-content');
    var readMore   = document.getElementById('roomReadMore');
    var readMoreLb = readMore && readMore.querySelector('.rrm-label');
    var mediaEl    = feature.querySelector('.room-feature-media');

    function setExpanded(expanded){
      if (!content || !readMore) return;
      content.classList.toggle('is-expanded', !!expanded);
      readMore.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      if (readMoreLb) readMoreLb.textContent = expanded ? 'Show less' : 'Read more about this room';
    }
    if (readMore) {
      readMore.addEventListener('click', function(){
        var open = readMore.getAttribute('aria-expanded') === 'true';
        setExpanded(!open);
      });
    }

    // Move gs-dots between image area (desktop) and content panel (mobile)
    function placeDots(){
      if (!dotsEl || !mediaEl || !content) return;
      if (isMobile()) {
        // Mobile: dots live at the very bottom — after the Reserve button row
        if (dotsEl.parentNode !== content || dotsEl !== content.lastElementChild) {
          content.appendChild(dotsEl);
        }
      } else {
        // Desktop: dots overlay the image
        if (dotsEl.parentNode !== mediaEl) mediaEl.appendChild(dotsEl);
      }
    }
    placeDots();
    if (mobileMQ.addEventListener) mobileMQ.addEventListener('change', placeDots);
    else if (mobileMQ.addListener) mobileMQ.addListener(placeDots);

    // Click a sidebar room card → swap room (+ scroll to gallery on mobile)
    listEl.addEventListener('click', function(ev){
      var btn = ev.target.closest('.room-card');
      if (!btn || !listEl.contains(btn)) return;
      ev.preventDefault();
      setRoom(btn);
      // Reset collapsed state on every room change
      setExpanded(false);
      // On mobile, smooth-scroll the gallery into view (account for sticky nav)
      if (isMobile()) {
        window.requestAnimationFrame(function(){
          var nav = document.getElementById('mainNav');
          var navH = nav ? nav.offsetHeight : 70;
          var rect = feature.getBoundingClientRect();
          var top = rect.top + window.pageYOffset - navH - 12;
          if (window.scrollTo) window.scrollTo({ top: top, behavior: 'smooth' });
        });
      }
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
    // Cache layout metrics; reading scrollHeight on every scroll frame
    // forces a reflow. Refresh only on resize / load instead.
    var cachedDocH = 0;
    function refreshDocH(){
      cachedDocH = document.documentElement.scrollHeight - window.innerHeight;
    }
    function updateProgress(){
      var pct = cachedDocH > 0 ? (window.scrollY / cachedDocH) * 100 : 0;
      prog.style.width = pct + '%';
      ticking = false;
    }
    window.addEventListener('scroll', function(){
      if (!ticking) {
        window.requestAnimationFrame(updateProgress);
        ticking = true;
      }
    }, { passive: true });
    window.addEventListener('resize', refreshDocH, { passive: true });
    window.addEventListener('load', refreshDocH);
    refreshDocH();
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
    var r = null;
    btn.addEventListener('mouseenter', function(){ r = btn.getBoundingClientRect(); });
    btn.addEventListener('mousemove', function(e){
      if (!r) r = btn.getBoundingClientRect();
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
      r = null;
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

  // ============================================================
  // REVIEWS — rotating 5-star reviews sourced from JSON-LD
  // ============================================================
  // Single source of truth: the LodgingBusiness "review" array in the
  // JSON-LD <script> in <head>. Update reviews there and they flow into
  // both Google's structured-data parsers AND this rotator.
  (function initReviews(){
    var rotator = document.getElementById('reviewsRotator');
    var dotsEl  = document.getElementById('reviewsDots');
    if (!rotator) return;

    function readJsonLdReviews(){
      var scripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (var s = 0; s < scripts.length; s++) {
        try {
          var data = JSON.parse(scripts[s].textContent || '{}');
          var graph = Array.isArray(data['@graph']) ? data['@graph'] : (Array.isArray(data) ? data : [data]);
          for (var i = 0; i < graph.length; i++) {
            var node = graph[i];
            if (node && Array.isArray(node.review) && node.review.length) return node.review;
          }
        } catch(e) { /* malformed JSON-LD — skip */ }
      }
      return [];
    }

    function isFiveStar(r){
      var rating = r && r.reviewRating && r.reviewRating.ratingValue;
      return rating === 5 || rating === '5' || parseInt(rating, 10) === 5;
    }

    function relativeDate(iso){
      if (!iso) return '';
      var then = new Date(iso);
      if (isNaN(then.getTime())) return '';
      var ms = Date.now() - then.getTime();
      var days = Math.floor(ms / 86400000);
      if (days < 14) return days <= 1 ? 'This week' : days + ' days ago';
      if (days < 60) return Math.round(days / 7) + ' weeks ago';
      var months = Math.round(days / 30);
      if (months < 12) return months + (months === 1 ? ' month ago' : ' months ago');
      var years = Math.round(months / 12);
      return years + (years === 1 ? ' year ago' : ' years ago');
    }

    function starSVG(){
      // Five solid stars; using a single SVG path repeated.
      var s = '';
      for (var i = 0; i < 5; i++) {
        s += '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01z"/></svg>';
      }
      return s;
    }

    function escapeHTML(s){
      return String(s).replace(/[&<>"']/g, function(c){
        return c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : '&#39;';
      });
    }

    // Try to upgrade the server-rendered fallback cards with the live
    // JSON-LD review array. If parsing fails or yields no 5-star reviews,
    // we leave the hardcoded fallback in place — never blank, never
    // "Loading..." stuck.
    var reviews = readJsonLdReviews().filter(isFiveStar);
    if (reviews.length) {
      // Replace fallback cards with the full set from JSON-LD (with relative dates).
      rotator.innerHTML = '';
      for (var k = 0; k < reviews.length; k++) {
        var r = reviews[k];
        var name = (r.author && r.author.name) ? r.author.name : 'Guest';
        var body = r.reviewBody || '';
        var when = relativeDate(r.datePublished);

        var card = document.createElement('article');
        card.className = 'review-card' + (k === 0 ? ' is-active' : '');
        card.setAttribute('role', 'group');
        card.setAttribute('aria-roledescription', 'review');
        card.setAttribute('aria-hidden', k === 0 ? 'false' : 'true');

        card.innerHTML =
          '<div class="review-stars" aria-label="Rated 5 out of 5 stars">' + starSVG() + '</div>' +
          '<blockquote class="review-quote">' + escapeHTML(body) + '</blockquote>' +
          '<div class="review-meta">' +
            '<div class="review-author">' + escapeHTML(name) + '</div>' +
            (when ? '<div class="review-date">' + escapeHTML(when) + '</div>' : '') +
          '</div>' +
          '<div class="review-source">via Google</div>';

        rotator.appendChild(card);
      }
    }

    // Operate on whatever cards are now in the DOM (hardcoded fallback OR JSON-LD render).
    var cards = Array.prototype.slice.call(rotator.querySelectorAll('.review-card'));
    if (!cards.length) return; // truly nothing to show — give up gracefully
    // Make sure exactly one card is active (defensive: in case fallback markup ever drifts).
    var hasActive = false;
    for (var ci = 0; ci < cards.length; ci++) {
      if (cards[ci].classList.contains('is-active')) { hasActive = true; break; }
    }
    if (!hasActive) {
      cards[0].classList.add('is-active');
      cards[0].setAttribute('aria-hidden', 'false');
    }

    // Build dots (only if more than one review)
    var dots = [];
    if (dotsEl && cards.length > 1) {
      // Clear any stale dots from a previous render.
      while (dotsEl.firstChild) dotsEl.removeChild(dotsEl.firstChild);
      for (var d = 0; d < cards.length; d++) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'reviews-dot' + (d === 0 ? ' is-active' : '');
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-label', 'Show review ' + (d + 1) + ' of ' + cards.length);
        dot.setAttribute('data-rev-index', String(d));
        if (d === 0) dot.setAttribute('aria-selected', 'true');
        dotsEl.appendChild(dot);
        dots.push(dot);
      }
      dotsEl.addEventListener('click', function(ev){
        var btn = ev.target.closest && ev.target.closest('.reviews-dot');
        if (!btn) return;
        var i = parseInt(btn.getAttribute('data-rev-index'), 10);
        if (!isNaN(i)) showReview(i, true);
      });
    }

    var activeIndex = 0;
    function showReview(i, manual){
      i = ((i % cards.length) + cards.length) % cards.length;
      if (i === activeIndex) return;
      cards[activeIndex].classList.remove('is-active');
      cards[activeIndex].setAttribute('aria-hidden', 'true');
      cards[i].classList.add('is-active');
      cards[i].setAttribute('aria-hidden', 'false');
      if (dots.length) {
        dots[activeIndex].classList.remove('is-active');
        dots[activeIndex].setAttribute('aria-selected', 'false');
        dots[i].classList.add('is-active');
        dots[i].setAttribute('aria-selected', 'true');
      }
      activeIndex = i;
      if (manual) restartTimer();
    }

    // Auto-rotate (only when section is visible, only if motion allowed, only if >1 review)
    var rotateMs = 7000;
    var timer = null;
    var isVisible = false;
    var isHovered = false;

    function clearTimer(){ if (timer) { clearInterval(timer); timer = null; } }
    function startTimer(){
      if (cards.length < 2 || prefersReduced) return;
      clearTimer();
      timer = setInterval(function(){
        if (isVisible && !isHovered) showReview(activeIndex + 1, false);
      }, rotateMs);
    }
    function restartTimer(){ clearTimer(); startTimer(); }

    rotator.addEventListener('mouseenter', function(){ isHovered = true; });
    rotator.addEventListener('mouseleave', function(){ isHovered = false; });

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function(entries){
        for (var e = 0; e < entries.length; e++) {
          isVisible = entries[e].isIntersecting;
        }
        if (isVisible) startTimer(); else clearTimer();
      }, { threshold: 0.25 });
      io.observe(rotator);
    } else {
      isVisible = true;
      startTimer();
    }
  })();

  // ============================================================
  // INSIDE DIVINE GUEST LODGE — gallery cells + scrollable lightbox
  // ============================================================
  (function initInsideGallery(){
    var galleryGrid = document.getElementById('galleryGrid');
    if (!galleryGrid) return;
    var cells = galleryGrid.querySelectorAll('.gallery-cell');
    if (!cells.length) return;

    var GALLERY_IMAGES = [
      '/images/gallery/divine-guest-Lodge-gallery-001.jpg',
      '/images/gallery/divine-guest-Lodge-gallery-002.jpg',
      '/images/gallery/divine-guest-Lodge-gallery-003.jpg',
      '/images/gallery/divine-guest-Lodge-gallery-004.jpg',
      '/images/gallery/divine-guest-Lodge-gallery-005.jpg',
      '/images/gallery/divine-guest-Lodge-gallery-006.jpg',
      '/images/gallery/divine-guest-Lodge-gallery-007.jpg',
      '/images/gallery/divine-guest-Lodge-gallery-008.jpg',
      '/images/gallery/divine-guest-Lodge-gallery-009.jpg',
      '/images/gallery/divine-guest-Lodge-gallery-010.jpg',
      '/images/gallery/divine-guest-Lodge-gallery-011jpg.jpg',
      '/images/gallery/divine-guest-Lodge-gallery-012.jpg',
      '/images/gallery/divine-guest-Lodge-gallery-013.jpg',
      '/images/gallery/divine-guest-Lodge-gallery-014jpg.jpg',
      '/images/gallery/divine-guest-Lodge-gallery-015.jpg'
    ];
    var TOTAL = GALLERY_IMAGES.length;
    var CELL_COUNT = cells.length;

    function setBg(el, url){
      if (!el || !url || !isSafeImageURL(url)) return;
      var safe = pickImageFormat(url).replace(/"/g, '%22');
      el.style.backgroundImage = 'url("' + safe + '")';
    }

    // Cell state — initial paint deferred until the section enters viewport
    var state = [];
    for (var c = 0; c < CELL_COUNT; c++) {
      var cell = cells[c];
      state.push({
        cell: cell,
        a: cell.querySelector('.gc-img-a'),
        b: cell.querySelector('.gc-img-b'),
        useA: true,
        idx: c % TOTAL
      });
    }
    var paintedInitial = false;
    function paintInitial(){
      if (paintedInitial) return;
      paintedInitial = true;
      for (var i = 0; i < state.length; i++) setBg(state[i].a, GALLERY_IMAGES[state[i].idx]);
    }

    // Looping rotation: round-robin one cell at a time so changes don't all
    // happen at once. Each cell advances by CELL_COUNT (mod TOTAL), keeping the
    // 6 visible images distinct at every moment.
    var rotateMs = 1400;
    var rotateTimer = null;
    var rotPtr = 0;
    var sectionVisible = false;

    function rotateOne(){
      var ci = rotPtr % CELL_COUNT;
      rotPtr++;
      var s = state[ci];
      var nextIdx = (s.idx + CELL_COUNT) % TOTAL;
      var hidden = s.useA ? s.b : s.a;
      var visible = s.useA ? s.a : s.b;
      var url = GALLERY_IMAGES[nextIdx];
      var fetchUrl = pickImageFormat(url);
      var preloadImg = new Image();
      preloadImg.onload = function(){
        setBg(hidden, url);
        hidden.classList.add('is-visible');
        visible.classList.remove('is-visible');
        s.useA = !s.useA;
        s.idx = nextIdx;
      };
      preloadImg.onerror = function(){};
      preloadImg.src = fetchUrl;
    }

    function startRotation(){
      if (rotateTimer || prefersReduced) return;
      if (TOTAL <= CELL_COUNT) return;
      if (!sectionVisible || document.hidden) return;
      rotateTimer = window.setInterval(rotateOne, rotateMs);
    }
    function stopRotation(){
      if (rotateTimer) { window.clearInterval(rotateTimer); rotateTimer = null; }
    }

    if ('IntersectionObserver' in window) {
      var sectionIO = new IntersectionObserver(function(entries){
        for (var i = 0; i < entries.length; i++) {
          sectionVisible = entries[i].isIntersecting;
          if (sectionVisible) {
            paintInitial();
            startRotation();
          } else {
            stopRotation();
          }
        }
      }, { threshold: 0.1 });
      sectionIO.observe(galleryGrid);
    } else {
      sectionVisible = true;
      paintInitial();
      startRotation();
    }

    // Pause rotation when the tab is backgrounded
    document.addEventListener('visibilitychange', function(){
      if (document.hidden) stopRotation();
      else if (sectionVisible) startRotation();
    });

    // -------- Carousel lightbox: swipe + auto-rotate, looping --------
    var glb        = document.getElementById('galleryLightbox');
    var glbImage   = document.getElementById('glbImage');
    var glbWrap    = document.getElementById('glbImageWrap');
    var glbClose   = document.getElementById('glbClose');
    var glbPrev    = document.getElementById('glbPrev');
    var glbNext    = document.getElementById('glbNext');
    var glbCurEl   = document.getElementById('glbCounterCur');
    var glbTotEl   = document.getElementById('glbCounterTotal');
    if (!glb || !glbImage || !glbWrap || !glbClose) return;

    var glbState = { open: false, index: 0, lastFocus: null };
    var glbAutoMs = 4000;
    var glbTimer = null;

    function preload(idx){
      // Eagerly fetch neighbours so swipes feel instant
      var next = (idx + 1) % TOTAL;
      var prev = (idx - 1 + TOTAL) % TOTAL;
      var a = new Image(); a.src = pickImageFormat(GALLERY_IMAGES[next]);
      var b = new Image(); b.src = pickImageFormat(GALLERY_IMAGES[prev]);
    }

    function renderGlb(idx){
      glbImage.classList.add('is-changing');
      window.setTimeout(function(){
        var url = GALLERY_IMAGES[idx];
        if (isSafeImageURL(url)) {
          var safe = pickImageFormat(url).replace(/"/g, '%22');
          glbImage.style.backgroundImage = 'url("' + safe + '")';
        }
        if (glbCurEl) glbCurEl.textContent = String(idx + 1);
        glbImage.setAttribute('aria-label',
          'Divine Guest Lodge gallery image ' + (idx + 1) + ' of ' + TOTAL);
        glbImage.classList.remove('is-changing');
        preload(idx);
      }, 180);
    }

    function glbAdvance(dir){
      glbState.index = (glbState.index + dir + TOTAL) % TOTAL;
      renderGlb(glbState.index);
    }

    function startGlbTimer(){
      stopGlbTimer();
      if (prefersReduced) return;
      if (TOTAL < 2) return;
      glbTimer = window.setInterval(function(){
        if (glbState.open) glbAdvance(1);
      }, glbAutoMs);
    }
    function stopGlbTimer(){
      if (glbTimer) { window.clearInterval(glbTimer); glbTimer = null; }
    }

    function openGlb(startIdx){
      if (glbState.open) return;
      glbState.open = true;
      glbState.index = Math.max(0, Math.min(startIdx || 0, TOTAL - 1));
      glbState.lastFocus = document.activeElement;
      if (glbTotEl) glbTotEl.textContent = String(TOTAL);

      glb.removeAttribute('hidden');
      // force reflow so the transition runs
      // eslint-disable-next-line no-unused-expressions
      glb.offsetHeight;
      glb.classList.add('is-open');
      glb.setAttribute('aria-hidden', 'false');
      document.body.classList.add('lightbox-locked');

      renderGlb(glbState.index);
      startGlbTimer();
      window.setTimeout(function(){ try { glbClose.focus(); } catch(e) {} }, 80);
    }

    function closeGlb(){
      if (!glbState.open) return;
      glbState.open = false;
      stopGlbTimer();
      glb.classList.remove('is-open');
      glb.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('lightbox-locked');
      window.setTimeout(function(){
        if (!glbState.open) glb.setAttribute('hidden', '');
      }, 380);
      if (glbState.lastFocus && typeof glbState.lastFocus.focus === 'function') {
        try { glbState.lastFocus.focus(); } catch(e) {}
      }
    }

    function cellOpen(cell){
      var ci = parseInt(cell.getAttribute('data-cell-index'), 10) || 0;
      var s = state[ci];
      var idx = s ? s.idx : 0;
      openGlb(idx);
    }

    for (var k = 0; k < CELL_COUNT; k++) {
      (function(cell){
        cell.addEventListener('click', function(){ cellOpen(cell); });
        cell.addEventListener('keydown', function(ev){
          if (ev.key === 'Enter' || ev.key === ' ') {
            ev.preventDefault();
            cellOpen(cell);
          }
        });
      })(cells[k]);
    }

    // Swipe (pointer-based, works for touch + mouse-drag)
    var glbSwipe = { active:false, startX:0, startY:0 };
    var GLB_SWIPE_TH = 45;
    var GLB_SWIPE_RATIO = 1.4;

    glbWrap.addEventListener('pointerdown', function(ev){
      if (ev.pointerType === 'mouse' && ev.button !== 0) return;
      glbSwipe.active = true;
      glbSwipe.startX = ev.clientX;
      glbSwipe.startY = ev.clientY;
    });
    function glbEndSwipe(ev){
      if (!glbSwipe.active) return;
      glbSwipe.active = false;
      var dx = ev.clientX - glbSwipe.startX;
      var dy = ev.clientY - glbSwipe.startY;
      if (Math.abs(dx) >= GLB_SWIPE_TH && Math.abs(dx) > Math.abs(dy) * GLB_SWIPE_RATIO) {
        glbAdvance(dx < 0 ? 1 : -1);
        startGlbTimer();
      }
    }
    glbWrap.addEventListener('pointerup', glbEndSwipe);
    glbWrap.addEventListener('pointercancel', function(){ glbSwipe.active = false; });

    // Pause auto-rotate while pointer is over the image (desktop only)
    glbWrap.addEventListener('mouseenter', stopGlbTimer);
    glbWrap.addEventListener('mouseleave', function(){ if (glbState.open) startGlbTimer(); });

    if (glbPrev) glbPrev.addEventListener('click', function(){ glbAdvance(-1); startGlbTimer(); });
    if (glbNext) glbNext.addEventListener('click', function(){ glbAdvance(1); startGlbTimer(); });
    glbClose.addEventListener('click', closeGlb);
    glb.addEventListener('click', function(ev){
      if (ev.target === glb) closeGlb();
    });

    document.addEventListener('keydown', function(ev){
      if (!glbState.open) return;
      if (ev.key === 'Escape') { ev.preventDefault(); closeGlb(); }
      else if (ev.key === 'ArrowLeft') { ev.preventDefault(); glbAdvance(-1); startGlbTimer(); }
      else if (ev.key === 'ArrowRight') { ev.preventDefault(); glbAdvance(1); startGlbTimer(); }
    });
  })();
})();
