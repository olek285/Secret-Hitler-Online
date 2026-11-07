/**
 * Publishes the height of the area the page can actually draw in as the CSS
 * variable --app-h on <html>.
 *
 * On iOS, 100vh includes the space under Safari's toolbars, so a layout sized
 * with it scrolls. window.innerHeight is the visible height, and it updates
 * when the toolbars show or hide. (visualViewport is deliberately not used: it
 * also shrinks for pinch-zoom and the keyboard, which would reflow the page.)
 * mobile.css sizes the phone layout from --app-h.
 */
let installed = false;

function update() {
  document.documentElement.style.setProperty(
    "--app-h",
    `${window.innerHeight}px`
  );
}

export function installViewportHeight(): void {
  if (installed) {
    return;
  }
  installed = true;
  update();
  window.addEventListener("resize", update);
  window.addEventListener("orientationchange", () => {
    // iOS reports the old size during the event itself.
    update();
    setTimeout(update, 300);
  });
}
