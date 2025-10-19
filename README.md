# Context Escape Hatch

A Chrome Extension that helps you save your current tab's intention (short note) and reminds you of it when you return to that tab.

## Features

- Save notes about your intention for specific tabs
- Get reminded of your intention when you return to a tab
- Edit or delete notes as needed
- Clean, minimal UI

## Installation

### Development Mode

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Build the extension:
   ```
   npm run build
   ```
4. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top-right corner
   - Click "Load unpacked" and select the `dist` folder from this project

## Usage

1. Click the extension icon in your browser toolbar
2. Enter a note about your intention for the current tab
3. Click "Save Note"
4. When you return to this tab later, you'll see a small overlay with your note

## Development

- Run in development mode: `npm run dev`
- Build for production: `npm run build`

## Tech Stack

- Manifest V3
- React + TypeScript
- Vite for building
- Chrome Storage API