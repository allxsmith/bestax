/**
 * Tiny haptic blip used to signal each item tick on the time-wheel scroller.
 *
 * Implementation: feature-detect `navigator.vibrate()` and call it with a
 * 5ms duration. Supported on Android Chrome (since v30), Firefox Android,
 * and Samsung Internet. Silently no-ops elsewhere.
 *
 * iOS Safari does not expose `navigator.vibrate` and has no other web-
 * accessible haptic API as of May 2026. We previously shipped a fallback
 * that toggled a hidden `<input type="checkbox" switch>` element via
 * `.click()` — that produced toggle haptics on iOS 17.4 through 26.4, but
 * Apple patched the loophole in iOS 26.5: haptics now only fire on
 * genuine, user-initiated taps on a visible switch, not on programmatic
 * invocation. There is no public WebKit ticket for the patch; it's
 * documented in the `tijnjh/ios-haptics` README and downstream community
 * write-ups. The Web Audio "silent buffer" trick unlocks audio playback
 * but never produced Taptic Engine output. PWAs added to the Home Screen
 * use the same WebKit and gain no extra haptic capability.
 *
 * If you need haptics on iOS, the only path today is wrapping the web view
 * in a native shell (Capacitor, react-native-webview) and bridging to
 * `UIImpactFeedbackGenerator`. Pure web cannot do it.
 */
export const tickHaptic = (): void => {
  if (
    typeof navigator !== 'undefined' &&
    typeof navigator.vibrate === 'function'
  ) {
    try {
      navigator.vibrate(5);
    } catch {
      // Some browsers throw on hidden documents — swallow.
    }
  }
};
