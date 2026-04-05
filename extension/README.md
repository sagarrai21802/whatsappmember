# WhatsApp Group Members Scraper - Chrome Extension

A Chrome Extension to scrape WhatsApp group members and export them to CSV.

## Installation

### Option 1: Load as Unpacked Extension (Development)

1. Download/extract the extension files
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right corner)
4. Click **Load unpacked**
5. Select the `extension` folder

### Option 2: Install from ZIP

1. Zip the `extension` folder
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode**
4. Click **Pack extension**
5. Select the `extension` folder
6. Or use "Load unpacked" with the zipped/extracted folder

## How to Use

### Step 1: Open Extension Popup
- Click the extension icon in Chrome to open the popup
- You can see the member count and access controls

### Step 2: Scrape Members
1. Click "Open WhatsApp Web" from the popup
2. Log in to your WhatsApp account
3. Navigate to any group
4. Click on the group name to open group info
5. Click "View all" to open the members modal
6. Scroll up and down to load all members

### Step 3: Export Data
- The extension automatically scrapes members as they load
- Click "Download CSV" in the popup to export
- Or use the floating button on WhatsApp Web

## Features

- **Auto-injection**: Automatically runs on WhatsApp Web
- **Persistent storage**: Members are saved even if you close the tab
- **CSV Export**: Export all scraped data to CSV
- **Group tracking**: Records which group each member came from
- **Draggable UI**: Move the floating widget anywhere on screen

## Fields Exported

| Field | Description |
|-------|-------------|
| Phone Number | Member's phone number |
| Name | Display name on WhatsApp |
| Description | WhatsApp status/about (when available) |
| Source | Name of the WhatsApp group |

## Troubleshooting

- **Not seeing members?** Make sure you're in the group members modal (click "View all")
- **Count not updating?** Try scrolling more in the members list
- **Reset not working?** Try refreshing WhatsApp Web after reset

## Files Structure

```
extension/
├── manifest.json    # Extension manifest (V3)
├── content.js       # Injected scraper script
├── popup.html       # Extension popup UI
├── popup.js         # Popup logic
└── icons/           # Extension icons
```

## License

MIT License