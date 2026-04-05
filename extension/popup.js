document.addEventListener('DOMContentLoaded', function() {
    const STORAGE_KEY = 'whatsapp-scraper-members';
    const memberCountEl = document.getElementById('memberCount');
    const downloadBtn = document.getElementById('downloadBtn');
    const openWebBtn = document.getElementById('openWebBtn');
    const resetBtn = document.getElementById('resetBtn');

    function updateCount() {
        chrome.storage.local.get(STORAGE_KEY, function(result) {
            const members = result[STORAGE_KEY] || [];
            memberCountEl.textContent = members.length.toString();
        });
    }

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

    downloadBtn.addEventListener('click', function() {
        chrome.storage.local.get(STORAGE_KEY, function(result) {
            const members = result[STORAGE_KEY] || [];
            if (members.length === 0) {
                alert('No members to export. Please scrape some members first.');
                return;
            }

            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const csvData = members.map(m => [
                m.phoneNumber || '',
                m.name || '',
                m.description || '',
                m.source || ''
            ]);
            exportToCsv(`whatsAppExport-${timestamp}.csv`, csvData);
        });
    });

    openWebBtn.addEventListener('click', function() {
        chrome.tabs.create({ url: 'https://web.whatsapp.com' });
    });

    resetBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to reset? All scraped data will be lost.')) {
            chrome.storage.local.set({ [STORAGE_KEY]: [] }, function() {
                updateCount();
            });
        }
    });

    // Update count on load
    updateCount();

    // Refresh count when storage changes
    chrome.storage.onChanged.addListener(function(changes, areaName) {
        if (areaName === 'local' && changes[STORAGE_KEY]) {
            updateCount();
        }
    });
});