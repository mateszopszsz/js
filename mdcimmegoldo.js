// ==UserScript==
// @name         MD cím error fix
// @namespace    http://tampermonkey.net/
// @version      6.9
// @description  md varazs
// @match        https://admin.moviedrive.hu/editSorozat/*
// @match        https://admin.moviedrive.hu/editMovie/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  function escapeSingleQuotesRespectingEscapes(s) {
    if (!s || s.length === 0) return s;
    let out = '';
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (ch === "'") {
        let k = i - 1, count = 0;
        while (k >= 0 && s[k] === '\\') { count++; k--; }
        if (count % 2 === 0) {
          out += '\\' + ch;
        } else {
          out += ch;
        }
      } else {
        out += ch;
      }
    }
    return out;
  }

  function processSingleInput(input) {
    try {
      if (!input || input.nodeType !== 1) return false;
      if (input.tagName.toLowerCase() !== 'input') return false;
      const t = (input.getAttribute('type') || '').toLowerCase();
      if (t !== 'text') return false;
      if (input.dataset.mdsEscaped === '1') return false;
      const val = input.value;
      if (typeof val === 'string' && val.includes("'")) {
        const newVal = escapeSingleQuotesRespectingEscapes(val);
        if (newVal !== val) {
          input.value = newVal;
          try {
            const ev = new Event('input', { bubbles: true, cancelable: true });
            input.dispatchEvent(ev);
          } catch (e) { }
        }
      }
      input.dataset.mdsEscaped = '1';
      return true;
    } catch (err) {
      console.error('EscapeSingleQuotes error for input', input, err);
      return false;
    }
  }

  function processAllTextInputs() {
    const nodes = document.querySelectorAll('input[type="text"]');
    let processed = 0;
    for (const input of nodes) {
      if (processSingleInput(input)) processed++;
    }
    if (processed > 0) {
      console.debug(`EscapeSingleQuotes: processed ${processed} inputs this pass`);
    }
    return processed;
  }

  function runInitialPasses() {
    processAllTextInputs();
    const delays = [200, 600, 1200, 2500];
    for (const d of delays) setTimeout(processAllTextInputs, d);
  }

  if (document.readyState === 'complete') {
    runInitialPasses();
  } else {
    window.addEventListener('load', runInitialPasses, { once: true });
  }

  const observer = new MutationObserver(mutations => {
    for (const m of mutations) {
      if (!m.addedNodes || m.addedNodes.length === 0) continue;
      m.addedNodes.forEach(node => {
        if (!node) return;
        if (node.nodeType === 1) {
          if (node.matches && node.matches('input[type="text"]')) {
            processSingleInput(node);
          }
          if (node.querySelectorAll) {
            const ins = node.querySelectorAll('input[type="text"]');
            if (ins && ins.length) ins.forEach(i => processSingleInput(i));
          }
        }
      });
    }
  });
  observer.observe(document.documentElement || document.body, { childList: true, subtree: true });

})();
