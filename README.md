# spacezero
Webpage based FPV game made by Vinny, AI and me

## Development
- Install deps: `pnpm install`
- Start dev server (LAN enabled): `pnpm dev`
- Open the printed local URL in a desktop browser
- For mobile testing, open `http://<your-lan-ip>:5173/` on the same Wi-Fi network

## Mobile input testing
- iOS Safari requires a user gesture to request gyro access.
- Tap `Gyro: Off` to trigger the permission prompt, then tap `Calibrate` while holding the phone steady.
- Dual sticks are bottom-left (move) and bottom-right (look); buttons are above the right stick.
