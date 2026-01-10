// ==UserScript==
// @name         Title varazsolo
// @version      6.9
// @description  ncore md
// @match        https://ncore.pro/*
// @match        https://admin.moviedrive.hu/editSorozat/*
// @match        https://admin.moviedrive.hu/editMovie/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    
    function ncoreGetCleanTitle() {
        const infoBar = document.querySelector('.infobar_title');
        if (!infoBar) return null;
        return infoBar.innerText.split('(')[0].replace(/\s+/g, ' ').trim();
    }

    function ncoreGetQualityInfo() {
        const details = document.querySelector('.torrent_reszletek_cim');
        if (!details) return '';
        const text = details.innerText.toUpperCase();
        let quality = '';
        if (text.includes('2160P')) quality = '4K';
        else if (text.includes('1080P')) quality = 'FHD';
        else if (text.includes('720P')) quality = 'HD';
        else if (text.includes('480P')) quality = 'SD';
        const hasHDR = text.includes('HDR10') || text.includes('HDR');
        if (!quality) return '';
        return hasHDR ? `HDR | ${quality}` : quality;
    }

    function ncoreUpdateTitle() {
        const title = ncoreGetCleanTitle();
        if (!title) return;
        const qualityInfo = ncoreGetQualityInfo();
        if (qualityInfo) {
            document.title = `${qualityInfo} | ${title}`;
        } else {
            document.title = title;
        }
    }

    function ncoreUpdateSearchPageTitle() {
        if (!location.href.includes('/torrents.php')) return;
        const searchInput = document.querySelector('#mire');
        if (!searchInput) return;
        const value = searchInput.value.trim();
        if (!value) return;
        document.title = `🔎 | ${value}`;
    }

    
    function movieDriveUpdateTitle() {
        const input = document.querySelector('#title');
        if (!input) return;
        const value = input.value.trim();
        if (!value) return;

        let prefix = '';
        if (location.href.includes('/editSorozat/')) {
            prefix = 'Sor.';
        } else if (location.href.includes('/editMovie/')) {
            prefix = 'Film';
        } else {
            return;
        }

        document.title = `${prefix} | ${value}`;
    }

    
    function run() {
        if (location.hostname === 'ncore.pro') {
            ncoreUpdateTitle();
            ncoreUpdateSearchPageTitle();
        } else if (location.hostname === 'admin.moviedrive.hu') {
            movieDriveUpdateTitle();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }

})();
