import NoSleep from "nosleep.js";

/**
 * Best-effort "keep the screen on" for phones.
 *
 * On plain http (LAN hosting) the Wake Lock API is unavailable because it
 * needs a secure context, so NoSleep falls back to looping a tiny invisible
 * video. Browsers only allow that to start from a user gesture, so we
 * (re)enable on the next tap after the page becomes visible again.
 */
let noSleep: NoSleep | undefined;
let installed = false;

function enable() {
  if (!noSleep) {
    noSleep = new NoSleep();
  }
  if (!noSleep.isEnabled) {
    noSleep.enable().catch(() => {
      // Not allowed right now (no gesture / unsupported); retry on next tap.
    });
  }
}

export function installKeepAwake() {
  if (installed) {
    return;
  }
  installed = true;
  document.addEventListener("click", enable, true);
  document.addEventListener("touchend", enable, true);
  document.addEventListener("visibilitychange", () => {
    // The fallback video is paused by the browser while hidden; mark it as
    // disabled so the next tap restarts it.
    if (document.visibilityState === "hidden" && noSleep?.isEnabled) {
      noSleep.disable();
    }
  });
}
