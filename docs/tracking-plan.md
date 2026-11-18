# Adventure Bay — Amplitude tracking plan

Events are sent with the Amplitude Browser SDK 2 through `src/analytics.js` (`window.BayAnalytics`).
Event names use **Title Case "Object Action"**; property names use **snake_case**.

## Privacy rules (children's app)

| Rule | How it is enforced |
|---|---|
| Parent control, on by default | Sharing is on unless a parent turns **Share anonymous usage data** off in the Parents' Corner (behind a grown-up maths check). The choice is stored in `localStorage` (`bay2_analytics_consent`); turning it off calls `setOptOut(true)` and drops queued events. The default is `analyticsOnByDefault` in `src/config.js`: **set it to `false` (parent must opt in) before offering the game to the public**, since COPPA and GDPR-K treat device IDs collected from young children as personal data that needs a parent's consent first. |
| No personal data | The child's name, typed text and free-form content are never sent. No `user_id` is set; Amplitude's random device ID is the only identifier. |
| No IP address | `trackingOptions.ipAddress: false`. Also turn on IP filtering / "Do not store IP" in the Amplitude project settings. |
| Minimal auto-capture | Only `sessions` is auto-captured. Page views, element clicks, forms, file downloads and marketing attribution are off. |
| No key, no SDK | With an empty `amplitudeApiKey` in `src/config.js`, the SDK script is never loaded. |

Before going public, add a short privacy notice for parents and check it against the rules where you publish (COPPA in the US, GDPR-K in the EU / Israel's Privacy Protection Law).

## Properties sent with every event

| Property | Type | Example | Notes |
|---|---|---|---|
| `language` | string | `en`, `he`, `nl` | Current game language |
| `age_level` | number | `4`–`7` | The level being played (the child's saved age) |

## Events

| Event | When it fires | Properties |
|---|---|---|
| `App Opened` | Game loads | `returning` (bool: any station ever finished), `age_set` (bool) |
| `Age Level Set` | Age chosen on first launch or changed by a parent | `age_level`, `source` (`first_launch` \| `parents_corner`) |
| `Language Changed` | Language switch tapped | `to` (`en` \| `he`) |
| `World Opened` | A world's map is opened from home or "Continue" | `world`, `stations_done`, `stations_total`, `practice_offered` (bool) |
| `Station Started` | A station begins | `world`, `station_index`, `station_name` (English), `review_question` (bool: a weak skill or a different kind of question was mixed in), `replay` (bool: the stop was already finished) |
| `Question Answered` | A question is solved (fires once per question, on the correct answer) | `world`, `station_index` (-1 = practice), `is_practice`, `question_index`, `skill`, `question_type`, `difficulty_level` (-1 easier · 0 on level · 1 harder), `first_try` (bool), `attempts`, `time_to_answer_ms`, `hint_shown` (bool), `interaction` (`choice` \| `task`) |
| `Hint Shown` | The guide gives a hint | `world`, `reason` (`second_wrong_try` \| `idle`), `skill` |
| `Skill Level Changed` | A skill moves between easier / on level / harder | `world`, `skill`, `from_level`, `to_level` |
| `Station Completed` | All 4 questions of a station are done | `world`, `station_index`, `station_name`, `stars`, `max_stars`, `duration_ms` |
| `World Completed` | The last station of a world is done | `world`, `world_stars` |
| `Treasure Opened` | The open treasure chest on a finished map is tapped | `world` |
| `Practice Started` | "Practice with the guide" round begins | `world`, `skills` (array), `skill_count` |
| `Practice Completed` | Practice round finished | `world`, `stars`, `max_stars`, `duration_ms` |
| `Guide Tapped` | The guide animal is tapped for a fact or joke | `guide` (`home`, `math`, `letters`, `science`, `logic`, `feelings`) |
| `Trophy Shelf Viewed` | Trophy shelf opened from home | – |
| `Parents Corner Opened` | Grown-up check passed | – |
| `Parents Gate Failed` | Grown-up check answered wrong | – |
| `Progress Reset` | A parent resets progress | `scope` (`age` \| `all`), `age_level` |
| `Voice Toggled` | Sound button tapped | `voice_on` |
| `Voice Speed Changed` | Speed changed in Parents' Corner | `speed` (`0.8` \| `1`) |
| `Analytics Consent Given` | A parent turns sharing back on | – |
| `Analytics Turned Off` | A parent turns sharing off (sent just before it stops) | – |
| `session_start` / `session_end` | Amplitude auto-capture | – |

`world` values: `math` (Numbers Bay), `letters` (Letters Island), `science` (Discoveries Reef), `logic` (Puzzles Port), `feelings` (Feelings Lagoon).
`skill` is the question kind without its number suffix (for example `count`, `addPic`, `rhyme`, `boat`, `share`); `question_type` keeps the suffix (`count15`).

## User properties

| Property | Type | Notes |
|---|---|---|
| `language` | string | Last used language |
| `age_level` | number | Saved level (4–7) |
| `total_stars` | number | Stars at the saved level, all worlds |
| `worlds_completed` | number | Worlds finished at the saved level |
| `voice_on` | bool | Read-aloud on or off |
| `app_version` | string | From `src/config.js` |

## Suggested Amplitude charts

1. **Learning funnel:** `World Opened` → `Station Started` → `Station Completed` → `World Completed`, grouped by `world`.
2. **Skill mastery:** `Question Answered`, % where `first_try = true`, grouped by `skill` and `age_level`. Low bars show which skills need better questions.
3. **Difficulty fit:** `Question Answered` grouped by `difficulty_level`. Check that most answers land "on level" and that harder questions still succeed more than half the time.
4. **Time on task:** average `time_to_answer_ms` by `skill`. Very long times may mean the question is unclear or the voice is hard to understand.
5. **Help needed:** `Hint Shown` by `reason` and `skill`.
6. **Practice adoption:** `Practice Started` ÷ `World Opened` where `practice_offered = true`.
7. **Retention:** returning users by week (uses the anonymous device ID; reinstalling or clearing the browser counts as a new user).

## Verifying events

1. Put your API key in `src/config.js`, run `npm start`, and open `http://localhost:8080/?debug_analytics=1`.
2. Sharing is on by default (check that **Share anonymous usage data** shows On in the Parents' Corner).
3. Play a station. Each event is logged in the browser console as `[analytics] track …`.
4. In Amplitude, open **User Lookup** (or the ingestion debugger) and find the device to see the events arrive.
