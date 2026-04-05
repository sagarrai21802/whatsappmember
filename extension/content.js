(function() {
    'use strict';

    const STORAGE_KEY = 'whatsapp-scraper-members';
    const counterId = 'wa-scraper-counter';
    const exportName = 'whatsAppExport';

    let members = [];
    let isScraping = false;
    let currentGroupSource = null;

    // UI Container
    const uiContainer = document.createElement('div');
    uiContainer.id = 'wa-scraper-container';
    uiContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 99999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
    `;

    // Storage functions
    async function loadMembers() {
        return new Promise((resolve) => {
            chrome.storage.local.get(STORAGE_KEY, (result) => {
                members = result[STORAGE_KEY] || [];
                resolve(members);
            });
        });
    }

    async function saveMembers() {
        return new Promise((resolve) => {
            chrome.storage.local.set({ [STORAGE_KEY]: members }, resolve);
        });
    }

    function cleanName(name) {
        if (!name) return '';
        return name.trim().replace('~ ', '');
    }

    function cleanDescription(description) {
        if (!description) return null;
        const desc = description.trim();
        if (!desc.match(/Loading About/i) &&
            !desc.match(/I am using WhatsApp/i) &&
            !desc.match(/Available/i)) {
            return desc;
        }
        return null;
    }

    // Export to CSV
    function exportToCsv(filename, data) {
        const headers = ['Phone Number', 'Name', 'Description', 'Source'];
        let csv = headers.join(',') + '\n';

        data.forEach(row => {
            const rowStr = row.map(cell => {
                const val = cell || '';
                const str = val.toString();
                if (str.search(/("|,|\n)/g) >= 0) {
                    return '"' + str.replace(/"/g, '""') + '"';
                }
                return str;
            }).join(',');
            csv += rowStr + '\n';
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }

    // UI Builder
    function buildUI() {
        const widget = document.createElement('div');
        widget.style.cssText = `
            background: #25d366;
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            min-width: 180px;
            cursor: move;
            user-select: none;
        `;

        const title = document.createElement('div');
        title.style.cssText = `
            font-weight: 600;
            margin-bottom: 10px;
            font-size: 13px;
            opacity: 0.9;
        `;
        title.textContent = 'WhatsApp Scraper';

        const btnDownload = document.createElement('button');
        btnDownload.style.cssText = `
            background: white;
            color: #075e54;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 600;
            width: 100%;
            margin-bottom: 8px;
        `;
        btnDownload.innerHTML = `Download <span id="${counterId}" style="font-weight:700">0</span> users`;

        const btnReset = document.createElement('button');
        btnReset.style.cssText = `
            background: rgba(255,255,255,0.2);
            color: white;
            border: 1px solid rgba(255,255,255,0.3);
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            width: 100%;
        `;
        btnReset.textContent = 'Reset';

        const status = document.createElement('div');
        status.id = 'wa-scraper-status';
        status.style.cssText = `
            font-size: 11px;
            margin-top: 8px;
            opacity: 0.8;
        `;
        status.textContent = 'Open group members to start';

        // Event listeners
        btnDownload.addEventListener('click', async () => {
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const csvData = members.map(m => [
                m.phoneNumber || '',
                m.name || '',
                m.description || '',
                m.source || ''
            ]);
            exportToCsv(`${exportName}-${timestamp}.csv`, csvData);
        });

        btnReset.addEventListener('click', async () => {
            members = [];
            await saveMembers();
            updateCounter();
            status.textContent = 'Cache cleared';
        });

        widget.appendChild(title);
        widget.appendChild(btnDownload);
        widget.appendChild(btnReset);
        widget.appendChild(status);

        // Make draggable
        let isDragging = false, startX, startY, initialX, initialY;

        widget.addEventListener('mousedown', (e) => {
            if (e.target === btnDownload || e.target === btnReset) return;
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            const rect = widget.getBoundingClientRect();
            initialX = rect.left;
            initialY = rect.top;
            widget.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            widget.style.left = (initialX + dx) + 'px';
            widget.style.top = (initialY + dy) + 'px';
            widget.style.right = 'auto';
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            widget.style.cursor = 'move';
        });

        uiContainer.appendChild(widget);
        document.body.appendChild(uiContainer);
        loadMembers().then(updateCounter);
    }

    function updateCounter() {
        const el = document.getElementById(counterId);
        if (el) el.textContent = members.length.toString();
    }

    function updateStatus(text) {
        const el = document.getElementById('wa-scraper-status');
        if (el) el.textContent = text;
    }

    // Modal Observer
    let modalObserver = null;

    function getGroupName() {
        const groupNameNode = document.querySelectorAll("header span[style*='height']:not(.copyable-text)");
        if (groupNameNode.length === 1) {
            return groupNameNode[0].textContent;
        }
        return null;
    }

    function listenModalChanges() {
        const modalElems = document.querySelectorAll('[data-animate-modal-body="true"]');
        if (modalElems.length === 0) return;

        const modalElem = modalElems[0];
        const targetNode = modalElem.querySelector("div[style*='height']");
        if (!targetNode) return;

        currentGroupSource = getGroupName();
        updateStatus(`Scraping: ${currentGroupSource || 'Unknown'}`);

        const callback = (mutationList) => {
            for (const mutation of mutationList) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'role') {
                    const target = mutation.target;
                    if (target.tagName === 'DIV' && target.getAttribute('role') === 'listitem') {
                        setTimeout(async () => {
                            await processMember(target);
                        }, 50);
                    }
                }
            }
        };

        modalObserver = new MutationObserver(callback);
        modalObserver.observe(targetNode, { attributes: true, childList: true, subtree: true });

        // Also check existing members
        setTimeout(() => {
            const existingItems = targetNode.querySelectorAll('div[role="listitem"]');
            existingItems.forEach(item => processMember(item));
        }, 500);
    }

    async function processMember(listItem) {
        try {
            let profileName = '';
            let profileDescription = '';
            let profilePhone = '';

            // Name
            const titleElems = listItem.querySelectorAll("span[title]:not(.copyable-text)");
            if (titleElems.length > 0) {
                const text = titleElems[0].textContent;
                if (text) {
                    profileName = cleanName(text);
                }
            }

            if (!profileName) return;

            // Description
            const descElems = listItem.querySelectorAll("span[title].copyable-text");
            if (descElems.length > 0) {
                const text = descElems[0].textContent;
                if (text) {
                    const desc = cleanDescription(text);
                    if (desc) profileDescription = desc;
                }
            }

            // Phone
            const phoneElems = listItem.querySelectorAll("span[style*='height']:not([title])");
            if (phoneElems.length > 0) {
                const text = phoneElems[0].textContent;
                if (text) {
                    const cleaned = text.trim();
                    if (cleaned) profilePhone = cleaned;
                }
            }

            const identifier = profilePhone || profileName;

            // Check if already exists
            const exists = members.some(m => m.profileId === identifier);
            if (exists) return;

            const member = {
                profileId: identifier,
                name: profileName,
                description: profileDescription || undefined,
                phoneNumber: profilePhone || undefined,
                source: currentGroupSource || undefined
            };

            members.push(member);
            await saveMembers();
            updateCounter();

            console.log('WhatsApp Scraper: Added', profileName);
        } catch (e) {
            console.error('Error processing member:', e);
        }
    }

    function stopListening() {
        if (modalObserver) {
            modalObserver.disconnect();
            modalObserver = null;
        }
    }

    // Main body observer to detect modal
    let bodyObserver = null;

    function startObserving() {
        const app = document.getElementById('app');
        if (!app) {
            setTimeout(startObserving, 1000);
            return;
        }

        const callback = (mutationList) => {
            for (const mutation of mutationList) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        const htmlNode = node;
                        const modalElems = htmlNode.querySelectorAll('[data-animate-modal-body="true"]');
                        if (modalElems.length > 0) {
                            setTimeout(() => {
                                listenModalChanges();
                                updateStatus('Modal found - Scroll to scrape');
                            }, 100);
                        }
                    });

                    mutation.removedNodes.forEach((node) => {
                        const htmlNode = node;
                        const modalElems = htmlNode.querySelectorAll('[data-animate-modal-body="true"]');
                        if (modalElems.length > 0) {
                            stopListening();
                            updateStatus('Modal closed');
                        }
                    });
                }
            }
        };

        bodyObserver = new MutationObserver(callback);
        bodyObserver.observe(app, { childList: true, subtree: true });
    }

    // Initialize
    function init() {
        buildUI();
        startObserving();
        console.log('WhatsApp Group Members Scraper loaded');
    }

    // Start when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();