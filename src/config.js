/* Adventure Bay — deployment settings.
   The Amplitude API key is a public, client-side key (it only allows sending events), so it is safe to commit.
   Leave it empty to turn analytics off completely. */
window.ADVENTURE_BAY_CONFIG = {
  appVersion: '1.0.0',

  // Amplitude → Settings → Projects → (your project) → General → API Key
  amplitudeApiKey: '',

  // 'US' (default) or 'EU' if your Amplitude organization is hosted in the EU data center
  serverZone: 'US',

  // Amplitude Browser SDK 2, pinned to an exact version
  sdkUrl: 'https://cdn.jsdelivr.net/npm/@amplitude/analytics-browser@2.11.1/lib/scripts/amplitude-min.js',

  // Anonymous usage data is shared unless a parent turns it off in the Parents' Corner.
  // Set to false to require a parent to turn it on first (recommended for apps offered to the public, see docs/tracking-plan.md).
  analyticsOnByDefault: true,

  // true = log every event to the browser console (same as adding ?debug_analytics=1 to the URL)
  debug: false
};
