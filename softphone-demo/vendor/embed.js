/**
 * Softphone embed loader (Option C demo).
 *
 * The customer pastes ONE line into their page:
 *   <script src="https://<vendor-cdn>/embed.js" data-token="..." data-mode="toolbar" async></script>
 *
 * Placement (pattern 2 with pattern 1 as fallback):
 *   - data-container="#some-selector"  -> mounts INTO that element, wherever
 *     it is in the page; the script tag's own position stops mattering.
 *   - no data-container (or selector not found) -> mounts where the script
 *     tag sits, so pasting the tag in place still works.
 *
 * This script runs first-party in the HOST page's origin, so unlike code
 * inside the iframe it CAN create/position/resize the iframe element.
 *
 * The widget's origin and URL are derived from this script's own src, so the
 * same file works from any host: a local dev server, GitHub Pages
 * (same-origin demo), or the production CDN (cross-origin).
 */
(function () {
  var MIN_H = 52;   // collapsed toolbar height
  var MAX_H = 800;  // sanity clamp on reported heights

  // currentScript is only valid during initial execution — capture everything
  // now; by the time a DOMContentLoaded callback runs it would be null.
  var script       = document.currentScript;
  var token        = script.getAttribute('data-token')     || '';
  var mode         = script.getAttribute('data-mode')      || 'toolbar';
  var containerSel = script.getAttribute('data-container') || null;

  // widget.html sits next to embed.js, wherever embed.js was loaded from.
  var scriptUrl     = new URL(script.src, location.href);
  var WIDGET_ORIGIN = scriptUrl.origin;
  var widgetUrl     = new URL('widget.html', scriptUrl);
  widgetUrl.search  = '?token=' + encodeURIComponent(token)
                    + '&mode='  + encodeURIComponent(mode);

  // Wrapper reserves only the toolbar's 52px in the host layout; the iframe
  // is absolutely positioned inside it, so growing taller OVERLAYS the page
  // below instead of pushing it down.
  var wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:relative;height:' + MIN_H + 'px;';

  var iframe = document.createElement('iframe');
  iframe.src = widgetUrl.href;
  iframe.allow = 'microphone; camera; autoplay; encrypted-media';
  iframe.setAttribute('scrolling', 'no');
  iframe.style.cssText =
    'position:absolute;top:0;left:0;width:100%;height:' + MIN_H + 'px;' +
    'border:0;display:block;z-index:2147483000;';

  wrapper.appendChild(iframe);

  function mount() {
    var target = containerSel ? document.querySelector(containerSel) : null;
    if (containerSel && !target) {
      console.warn('[softphone] data-container "' + containerSel +
                   '" not found; mounting at the script tag instead.');
    }
    if (target) {
      target.appendChild(wrapper);
    } else {
      // Pattern 1 fallback: insert where the script tag sits.
      script.parentNode.insertBefore(wrapper, script);
    }
  }

  // With async, this script can run before the rest of the DOM is parsed.
  // If a container was requested, its element may simply not exist YET —
  // wait for the full parse before looking it up. Without a container the
  // script tag itself is always available, so mount immediately.
  if (containerSel && document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }

  // The heart of Option C, host side: apply whatever height the widget
  // reports. Nothing is hardcoded beyond a min/max clamp.
  window.addEventListener('message', function (e) {
    if (e.origin !== WIDGET_ORIGIN) return;              // only trust our widget
    var d = e.data;
    if (d && d.type === 'softphone:resize' && typeof d.height === 'number') {
      var h = Math.min(Math.max(Math.ceil(d.height), MIN_H), MAX_H);
      iframe.style.height = h + 'px';
    }
  });
})();
