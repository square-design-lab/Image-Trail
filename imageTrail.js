/* ============================================================
   SDL Image Trail  v1.0
   No-class IIFE · fetches blog collection images
   Applies to sections with ID "image-trail"
   5 effect modes: fadeScale, smoothTrail, popIn, tiltDrift, snapGrid
   ============================================================ */
(function () {
  'use strict';

  var CFG = window.SDL_IMAGE_TRAIL_CONFIG || {};

  var DEFAULTS = {
    collectionUrl:    '/blog',
    limit:            20,
    effect:           'fadeScale',
    imageWidth:       250,
    imageHeight:      330,
    borderRadius:     '6px',
    rotation:         12,
    trailLength:      10,
    fadeSpeed:        800,
    mouseThreshold:   60,
    grayscale:        false,
    shadow:           '0 6px 25px rgba(0,0,0,0.18)',
    disableOnMobile:  true,
    mobileBreakpoint: 768,
    imageSize:        '500w'
  };

  function opt(key) { return CFG[key] !== undefined ? CFG[key] : DEFAULTS[key]; }

  /* ---- effect definitions ---- */
  var effects = {

    fadeScale: {
      show: function (el, ctx) {
        var rot = (Math.random() - 0.5) * opt('rotation') * 2;
        el.style.transition = 'transform 0.35s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease';
        el.style.transform = 'translate(-50%,-50%) scale(0.5) rotate(' + rot + 'deg)';
        el.style.opacity = '0';
        void el.offsetWidth;
        el.style.transform = 'translate(-50%,-50%) scale(1) rotate(' + rot + 'deg)';
        el.style.opacity = '1';
      },
      hide: function (el) {
        el.style.transition = 'transform ' + opt('fadeSpeed') + 'ms ease, opacity ' + opt('fadeSpeed') + 'ms ease';
        var rot = parseFloat(el.style.transform.match(/rotate\(([-\d.]+)deg\)/)?.[1] || 0);
        el.style.transform = 'translate(-50%,-50%) scale(0.4) rotate(' + rot + 'deg)';
        el.style.opacity = '0';
      }
    },

    smoothTrail: {
      show: function (el) {
        var rot = (Math.random() - 0.5) * 6;
        el.style.transition = 'transform 0.25s ease-out, opacity 0.2s ease';
        el.style.transform = 'translate(-50%,-50%) scale(0.9) rotate(' + rot + 'deg)';
        el.style.opacity = '0';
        void el.offsetWidth;
        el.style.transform = 'translate(-50%,-50%) scale(1) rotate(' + rot + 'deg)';
        el.style.opacity = '1';
      },
      hide: function (el) {
        var speed = Math.max(opt('fadeSpeed'), 1200);
        el.style.transition = 'opacity ' + speed + 'ms ease';
        el.style.opacity = '0';
      }
    },

    popIn: {
      show: function (el) {
        el.style.transition = 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s ease';
        el.style.transform = 'translate(-50%,-50%) scale(0)';
        el.style.opacity = '0';
        void el.offsetWidth;
        el.style.transform = 'translate(-50%,-50%) scale(1.05)';
        el.style.opacity = '1';
        setTimeout(function () {
          el.style.transform = 'translate(-50%,-50%) scale(1)';
        }, 250);
      },
      hide: function (el) {
        el.style.transition = 'transform 0.3s cubic-bezier(0.55,0,1,0.45), opacity 0.3s ease';
        el.style.transform = 'translate(-50%,-50%) scale(0)';
        el.style.opacity = '0';
      }
    },

    tiltDrift: {
      show: function (el, ctx) {
        var dx = ctx.dx || 0;
        var dy = ctx.dy || 0;
        var angle = Math.atan2(dy, dx) * (180 / Math.PI);
        var tilt = Math.max(-20, Math.min(20, angle * 0.15));
        el.style.transition = 'transform 0.35s ease-out, opacity 0.25s ease';
        el.style.transform = 'translate(-50%,-50%) scale(0.8) rotate(' + tilt + 'deg)';
        el.style.opacity = '0';
        void el.offsetWidth;
        el.style.transform = 'translate(-50%,-50%) scale(1) rotate(' + tilt + 'deg)';
        el.style.opacity = '1';
        el._tilt = tilt;
      },
      hide: function (el) {
        var tilt = el._tilt || 0;
        var driftX = (Math.random() - 0.5) * 40;
        var driftY = 30 + Math.random() * 20;
        el.style.transition = 'transform ' + opt('fadeSpeed') + 'ms ease, opacity ' + opt('fadeSpeed') + 'ms ease';
        el.style.transform = 'translate(calc(-50% + ' + driftX + 'px), calc(-50% + ' + driftY + 'px)) scale(0.7) rotate(' + (tilt + 5) + 'deg)';
        el.style.opacity = '0';
      }
    },

    snapGrid: {
      show: function (el) {
        var gridSize = 60;
        var cx = parseFloat(el.style.left);
        var cy = parseFloat(el.style.top);
        var snappedX = Math.round(cx / gridSize) * gridSize + (Math.random() - 0.5) * 30;
        var snappedY = Math.round(cy / gridSize) * gridSize + (Math.random() - 0.5) * 30;
        el.style.left = snappedX + 'px';
        el.style.top = snappedY + 'px';
        el.style.clipPath = 'circle(0% at 50% 50%)';
        el.style.transform = 'translate(-50%,-50%) scale(1)';
        el.style.opacity = '1';
        el.style.transition = 'clip-path 0.5s cubic-bezier(0.22,1,0.36,1)';
        void el.offsetWidth;
        el.style.clipPath = 'circle(75% at 50% 50%)';
      },
      hide: function (el) {
        el.style.transition = 'opacity ' + opt('fadeSpeed') + 'ms ease, clip-path ' + opt('fadeSpeed') + 'ms ease';
        el.style.clipPath = 'circle(0% at 50% 50%)';
        el.style.opacity = '0';
      }
    }
  };

  /* ---- fetch images ---- */
  function fetchImages(collectionUrl, limit, callback) {
    var url = collectionUrl + '?format=json&nocache=' + Date.now();

    fetch(url)
      .then(function (res) { return res.json(); })
      .then(function (data) {
        var items = data.items || [];
        var images = [];
        var size = opt('imageSize');
        for (var i = 0; i < items.length && images.length < limit; i++) {
          var asset = items[i].assetUrl;
          if (asset) images.push(asset + '?format=' + size);
        }
        callback(images);
      })
      .catch(function () { callback([]); });
  }

  /* ---- create trail instance per section ---- */
  function initSection(section) {
    if (section._sdlTrailInit) return;
    section._sdlTrailInit = true;

    var container = document.createElement('div');
    container.className = 'sdl-trail-container';
    section.insertBefore(container, section.firstChild);

    var imgPool = [];
    var activeImages = [];
    var imgIndex = 0;
    var zCounter = 0;
    var lastX = 0;
    var lastY = 0;
    var lastDx = 0;
    var lastDy = 0;

    var effectName = opt('effect');
    var currentEffect = effects[effectName] || effects.fadeScale;

    fetchImages(opt('collectionUrl'), opt('limit'), function (urls) {
      if (!urls.length) return;
      imgPool = urls;
      section.addEventListener('mousemove', onMouseMove);
    });

    function onMouseMove(e) {
      if (opt('disableOnMobile') && window.innerWidth <= opt('mobileBreakpoint')) return;

      var rect = section.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;

      var dx = x - lastX;
      var dy = y - lastY;
      var dist = Math.sqrt(dx * dx + dy * dy);

      var threshold = effectName === 'smoothTrail' ? Math.min(opt('mouseThreshold'), 40) : opt('mouseThreshold');

      if (dist < threshold) return;

      lastDx = dx;
      lastDy = dy;
      lastX = x;
      lastY = y;

      spawnImage(x, y);
    }

    function spawnImage(x, y) {
      var el = document.createElement('div');
      el.className = 'sdl-trail-img';
      el.style.width = opt('imageWidth') + 'px';
      el.style.height = opt('imageHeight') + 'px';
      el.style.borderRadius = opt('borderRadius');
      el.style.boxShadow = opt('shadow');
      el.style.backgroundImage = 'url(' + imgPool[imgIndex % imgPool.length] + ')';
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      el.style.zIndex = zCounter++;
      el.style.opacity = '0';

      if (opt('grayscale')) {
        el.style.filter = 'grayscale(100%)';
      }

      container.appendChild(el);
      imgIndex++;

      var ctx = { dx: lastDx, dy: lastDy };
      currentEffect.show(el, ctx);

      activeImages.push(el);

      /* schedule hide */
      var delay = effectName === 'smoothTrail' ? 600 : 350;
      setTimeout(function () {
        currentEffect.hide(el);
        setTimeout(function () {
          if (el.parentNode) el.parentNode.removeChild(el);
          var idx = activeImages.indexOf(el);
          if (idx > -1) activeImages.splice(idx, 1);
        }, opt('fadeSpeed') + 100);
      }, delay);

      /* enforce trail length */
      while (activeImages.length > opt('trailLength')) {
        var oldest = activeImages.shift();
        currentEffect.hide(oldest);
        (function (node) {
          setTimeout(function () {
            if (node.parentNode) node.parentNode.removeChild(node);
          }, opt('fadeSpeed') + 100);
        })(oldest);
      }
    }
  }

  /* ---- scan & init ---- */
  function scanSections() {
    var els = document.querySelectorAll('[id="image-trail"]');
    for (var i = 0; i < els.length; i++) {
      initSection(els[i]);
    }
  }

  /* ---- DOM ready ---- */
  function onReady() {
    scanSections();

    /* MutationObserver for dynamic sections */
    if (typeof MutationObserver !== 'undefined') {
      var observer = new MutationObserver(function (mutations) {
        for (var i = 0; i < mutations.length; i++) {
          var added = mutations[i].addedNodes;
          for (var j = 0; j < added.length; j++) {
            var node = added[j];
            if (node.nodeType === 1) {
              if (node.id === 'image-trail') initSection(node);
              var nested = node.querySelectorAll ? node.querySelectorAll('[id="image-trail"]') : [];
              for (var k = 0; k < nested.length; k++) initSection(nested[k]);
            }
          }
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }

  /* mercury:load for Squarespace AJAX nav */
  window.addEventListener('mercury:load', scanSections);

})();
