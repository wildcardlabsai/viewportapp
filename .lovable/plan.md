

# Device Mockup Feature

## Overview
Add a "Mockup" button to completed captures in History that opens a modal where users can place their screenshot inside realistic device frames (iPhone, MacBook, iPad, etc.) and download the result as a polished presentation image.

## How It Works

1. User clicks a new "Mockup" icon button on any completed capture in History
2. A modal opens showing the screenshot inside a default device frame
3. User picks from device options: MacBook Pro, iPhone 15, iPad, Samsung Galaxy
4. User can choose a background color/gradient
5. User clicks "Download Mockup" to get the composited image

## Device Frames Approach

Rather than shipping raster device frame images (which are heavy and hard to maintain), we will render device frames using **pure CSS/SVG** directly in the browser. This keeps the bundle small and works at any resolution.

- **MacBook Pro**: Rounded rectangle with bezel, bottom bar (keyboard area hint), subtle shadow
- **iPhone 15**: Pill-shaped notch (Dynamic Island), rounded corners, side buttons
- **iPad Pro**: Thin bezels, rounded corners, home indicator bar
- **Browser window**: Classic title bar with traffic light dots

The screenshot is placed inside the device "screen" area using a simple `<img>` tag within a styled container.

## Download Strategy

Use an HTML Canvas to composite the device frame + screenshot for export. We will use the `html-to-image` library (or manual canvas drawing) to render the mockup container to a PNG for download.

## Technical Plan

### 1. Create `src/components/MockupDialog.tsx`
- A Dialog/modal component that accepts an asset's `file_url` and `device_preset`
- Contains device frame selector (tabs or buttons for each device type)
- Background picker (white, gradient, dark, custom color)
- CSS-rendered device frames wrapping the screenshot image
- "Download" button that uses canvas export to save the composited image
- Padding/zoom controls for presentation spacing

### 2. Update `src/pages/History.tsx`
- Add a "Mockup" button (using `Smartphone` or `Monitor` icon) next to Share/Download for completed captures
- Wire up the MockupDialog with the selected asset's URL and device info

### 3. Device Frame CSS Components
Built inside MockupDialog as sub-components:
- `MacBookFrame` -- silver bezel, notch, keyboard bar
- `IPhoneFrame` -- rounded rect with Dynamic Island
- `IPadFrame` -- thin bezels
- `BrowserFrame` -- window chrome with dots

Each is a styled div that wraps the screenshot `<img>` and scales responsively.

### 4. Canvas Export for Download
- Use a ref on the mockup container
- On "Download", draw the container to a canvas using `html-to-image` (domtoimage alternative) or the native Canvas API with `drawImage`
- Trigger a PNG download

### Dependencies
- No new npm packages needed -- CSS frames + native Canvas API are sufficient
- If canvas rendering of CSS is tricky, we can add `html-to-image` (~3KB) as a fallback

### Files Changed
| File | Change |
|------|--------|
| `src/components/MockupDialog.tsx` | New -- device frame modal with CSS frames and export |
| `src/pages/History.tsx` | Add Mockup button per completed capture, wire dialog |

