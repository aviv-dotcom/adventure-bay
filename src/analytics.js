/* Adventure Bay — analytics bridge to Amplitude (Browser SDK 2).

   Privacy rules for a children's app (COPPA / GDPR-K minded):
   - Nothing is sent until a parent turns "Share anonymous usage data" on in the Parents' Corner (off by default).
   - No names, typed text or IP addresses are ever sent; users are identified only by Amplitude's random device ID.
   - Only session tracking is auto-captured; page views, clicks, forms, file downloads and marketing attribution are off.
   - With no API key in src/config.js, the SDK is never loaded.

   The game calls:  window.BayAnalytics.track(eventName, properties)
                    window.BayAnalytics.setUser(userProperties)
                    window.BayAnalytics.setConsent(true|false)
   Event names and properties are documented in docs/tracking-plan.md. */
(function(){
  const C = window.ADVENTURE_BAY_CONFIG || {};
  const CONSENT_KEY = 'bay2_analytics_consent';
  const MAX_QUEUE = 100;
  const debug = !!C.debug || /[?&]debug_analytics=1\b/.test(location.search);
  const log = (...a) => { if(debug) console.info('%c[analytics]', 'color:#8a5cf6;font-weight:bold', ...a); };

  let consent = false;
  try{ consent = JSON.parse(localStorage.getItem(CONSENT_KEY) || 'false') === true; }catch(e){}

  const state = { amp:null, loading:false, ready:false, queue:[] };
  const configured = () => !!C.amplitudeApiKey;
  const canSend = () => configured() && consent;

  function load(){
    if(state.loading || state.ready || !canSend()) return;
    state.loading = true;
    const s = document.createElement('script');
    s.src = C.sdkUrl; s.async = true; s.crossOrigin = 'anonymous';
    s.onload = () => {
      const amp = window.amplitude;
      if(!amp || !amp.init){ log('SDK loaded but window.amplitude is missing'); return; }
      amp.init(C.amplitudeApiKey, {
        serverZone: C.serverZone === 'EU' ? 'EU' : 'US',
        appVersion: C.appVersion,
        identityStorage: 'localStorage',
        trackingOptions: { ipAddress: false, language: true, platform: true },
        autocapture: { sessions: true, pageViews: false, attribution: false, formInteractions: false, fileDownloads: false, elementInteractions: false },
        logLevel: debug ? 4 : 1   // 4 = Debug, 1 = Error
      });
      amp.setOptOut(!consent);
      state.amp = amp; state.ready = true; state.loading = false;
      log('Amplitude ready', {serverZone: C.serverZone || 'US'});
      const q = state.queue.splice(0);
      q.forEach(([kind, args]) => send(kind, args));
    };
    s.onerror = () => { state.loading = false; log('Amplitude SDK failed to load (offline or blocked)'); };
    document.head.appendChild(s);
  }

  function send(kind, args){
    const amp = state.amp; if(!amp) return;
    try{
      if(kind === 'track') amp.track(args[0], args[1]);
      else if(kind === 'identify'){ const id = new amp.Identify(); Object.entries(args[0]).forEach(([k,v]) => { if(v !== undefined && v !== null) id.set(k, v); }); amp.identify(id); }
    }catch(e){ log('send failed', e); }
  }

  function enqueue(kind, args){
    if(!canSend()) return;
    if(state.ready){ send(kind, args); return; }
    if(state.queue.length < MAX_QUEUE) state.queue.push([kind, args]);
    load();
  }

  window.BayAnalytics = {
    track(name, props){ const p = Object.assign({}, props); log('track', name, p); enqueue('track', [name, p]); },
    setUser(props){ log('user properties', props); enqueue('identify', [Object.assign({}, props)]); },
    setConsent(on){
      consent = !!on;
      try{ localStorage.setItem(CONSENT_KEY, JSON.stringify(consent)); }catch(e){}
      if(state.amp) state.amp.setOptOut(!consent);
      if(consent) load(); else state.queue.length = 0;
      log('consent', consent);
    },
    get consent(){ return consent; },
    get configured(){ return configured(); }
  };

  log(configured() ? (consent ? 'configured, consent given' : 'configured, waiting for parent consent') : 'no API key: analytics off');
  if(canSend()) load();
})();
