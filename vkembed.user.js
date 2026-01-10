// ==UserScript==
// @name         vk embed link masolo
// @namespace    https://vkvideo.ru/
// @version      6.9
// @description  vk embed link masolo
// @author       Mateusz
// @match        https://vkvideo.ru/*
// @grant        GM_setClipboard
// ==/UserScript==

(function () {
    'use strict';

    function showPopup(link) {
        const existing = document.getElementById('vkvideo-copy-popup');
        if (existing) existing.remove();

        const popup = document.createElement('div');
        popup.id = 'vkvideo-copy-popup';
        popup.innerHTML = `
            <div style="font-size:16px; margin-bottom:4px;">másolva!!!!!</div>
            <div style="font-size:12px; opacity:0.9; word-break:break-all; max-width:420px;">${link}</div>
        `;
        Object.assign(popup.style, {
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            background: 'rgba(0,0,0,0.85)',
            color: '#fff',
            padding: '14px 20px',
            borderRadius: '12px',
            zIndex: '999999',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
            transform: 'translateY(30px)',
            opacity: '0'
        });
        document.body.appendChild(popup);

        requestAnimationFrame(() => {
            popup.style.opacity = '1';
            popup.style.transform = 'translateY(0)';
        });

        setTimeout(() => {
            popup.style.opacity = '0';
            popup.style.transform = 'translateY(30px)';
            setTimeout(() => popup.remove(), 500);
        }, 10000);
    }

    function handleVideoLink(link) {
        if (!link) return;
        let cleanLink = String(link).replace(/&amp;/g, '&');
        cleanLink = cleanLink.replace('vkvideo.ru', 'vk.com');
        const srcMatch = cleanLink.match(/src=(["']?)(https?:\/\/[^"'\s>]+video_ext\.php[^"'\s>]*)\1/);
        if (srcMatch && srcMatch[2]) cleanLink = srcMatch[2];
        cleanLink = cleanLink.replace(/(&hash=[^&]*)/g, (match, p1, offset, str) => {
            return str.indexOf(p1) === offset ? p1 : '';
        });
        if (handleVideoLink.lastCopied === cleanLink) return;
        handleVideoLink.lastCopied = cleanLink;

        try {
            GM_setClipboard(cleanLink);
            console.log('kész', cleanLink);
            showPopup(cleanLink);
        } catch (e) {
            console.error('elbasztál vmit:', e, cleanLink);
        }
    }

    function processEmbedInput(raw) {
        if (!raw || typeof raw !== 'string') return;
        const div = document.createElement('div');
        div.innerHTML = raw;
        const iframe = div.querySelector('iframe');
        if (iframe && iframe.src) {
            handleVideoLink(iframe.src);
            return;
        }
        const re = /src=&quot;([^&"]*video_ext\.php[^&"]*)&quot;/i;
        let m = raw.match(re);
        if (m && m[1]) {
            const decoded = m[1].replace(/&amp;/g, '&').replace('vkvideo.ru', 'vk.com');
            handleVideoLink(decoded);
            return;
        }
        const urlRe = /(https?:\/\/[^"\s']*video_ext\.php[^"\s']*)/i;
        m = raw.match(urlRe);
        if (m && m[1]) {
            const decoded = m[1].replace(/&amp;/g, '&').replace('vkvideo.ru', 'vk.com');
            handleVideoLink(decoded);
        }
    }

    function scanExisting() {
        document.querySelectorAll('iframe[src*="video_ext.php"]').forEach(iframe => {
            if (iframe.src) handleVideoLink(iframe.src);
        });

        document.querySelectorAll('input[value*="video_ext.php"]').forEach(input => {
            processEmbedInput(input.value);
        });

        document.querySelectorAll('[value*="video_ext.php"]').forEach(el => {
            if (el.tagName === 'INPUT') return;
            const val = el.getAttribute('value') || el.textContent;
            if (val && val.includes('video_ext.php')) processEmbedInput(val);
        });
    }

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.addedNodes && mutation.addedNodes.length) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType !== 1) continue;
                    if (node.tagName === 'IFRAME' && node.src && node.src.includes('video_ext.php')) {
                        handleVideoLink(node.src);
                    }
                    if (node.querySelectorAll) {
                        node.querySelectorAll('iframe[src*="video_ext.php"]').forEach(iframe => {
                            if (iframe.src) handleVideoLink(iframe.src);
                        });
                    }
                    if (node.tagName === 'INPUT' && node.value && node.value.includes('video_ext.php')) {
                        processEmbedInput(node.value);
                    }
                    if (node.querySelectorAll) {
                        node.querySelectorAll('input[value*="video_ext.php"]').forEach(inp => {
                            processEmbedInput(inp.value);
                        });
                    }
                }
            }
            if (mutation.type === 'attributes' && mutation.attributeName === 'value') {
                const target = mutation.target;
                if (target && target.tagName === 'INPUT' && target.value && target.value.includes('video_ext.php')) {
                    processEmbedInput(target.value);
                }
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['value'] });
    setTimeout(scanExisting, 400);
    console.log('anyad.');
})();
