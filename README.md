# Groundskeeper Visual Preference Study — V2

This is a **fresh project**, not a patch. It contains all 30 Groundskeeper screenshots and a new structured survey.

## Participant flow
1. Intro: estimated 5–9 minutes, anonymity and behavioral logging disclosed.
2. Four randomized king-of-the-hill matchups of whole six-image collections. Participant can preview hero and supplementary images. The initial order and left/right location vary by participant.
3. Rank top five of all 25 supplementary screenshots: first click = 5 points, fifth click = 1. Click a selected image again to remove it; remaining picks move up.
4. Ten mandatory five-point Likert statements; no name, pseudonym or free text.
5. Completion sends submission to Google Sheets, which assigns the next sequential participant number (1, 2, 3…).

## Data saved
The Google Apps Script creates separate **V2** tabs, preserving the earlier test data if you use the same Sheet:
- **Participants V2:** Anonymous number, timestamp, session ID, tournament order, all 4 matchups, left/right placement, duration, preview counts, winning collection, top five supplements, all 10 Likert ratings, overall duration.
- **Rankings V2:** Five rows per participant with points 5 through 1.
- **Supplementary Scores V2:** Automatically calculated points, selection counts, and number of first-place rankings.
- **Interactions V2:** Each supplementary thumbnail enlargement, round, collection, image ID, time into that round.

## Setup: Google Sheets (important)
1. Open the same Google Sheet you already used, then **Extensions > Apps Script**.
2. **Replace the entire old `Code.gs`** with this package's `GoogleAppsScript.gs` content. Save.
3. Script Properties: retain your **existing `SHEETS_SECRET`** value. Do not share or commit it.
4. Run `initialize()` once, and confirm four new **V2** tabs appear. (Old tabs remain untouched.)
5. Deploy > Manage deployments > Edit (pencil) > **Version: New version** > Deploy. Keep **Execute as Me**, **Who has access: Anyone**. If you do not deploy a new version, Google will continue to run the old script even if the editor shows new code.
6. Keep the resulting `/exec` web app URL.

## Setup: Render
1. Create a NEW GitHub repository and upload the **contents of this folder** (`public/`, `server.js`, `package.json`, README). Do NOT upload `GoogleAppsScript.gs` or secret values to GitHub; its source belongs only in Apps Script.
2. New Render Web Service > your new GitHub repo > Node > Build command `npm install` > Start command `node server.js`.
3. Under **Environment**, set `SHEETS_WEBHOOK_URL` to the Apps Script `/exec` URL and `SHEETS_SECRET` to the same private property in Apps Script.
4. Save, deploy, then open `/health` on your new Render URL: expect `sheetsConfigured: true`.
5. Submit one COMPLETE practice response. Verify the **Participants V2**, **Rankings V2**, **Interactions V2**, and **Supplementary Scores V2** tabs.
6. Delete your practice response from each V2 tab (but leave headers and the Supplementary Scores formulas intact) **before** recruiting real participants. If deleting participant entries, always delete the entire row, not just clear cells, so IDs begin at 1.

## Local preview
Install Node.js 20+, open this folder in Command Prompt, run `node server.js`, open `http://localhost:3000`. Without `SHEETS_WEBHOOK_URL` and `SHEETS_SECRET` set locally, submissions will be blocked, but all visual stages work.

## Study interpretation & limitations
- Preview clicks are **not eye-tracking**: a participant may inspect thumbnail images without clicking. Counts are therefore a proxy for deliberate enlargement, not complete attention.
- Match duration includes time spent away from the tab; it cannot by itself demonstrate uncertainty or engagement.
- The tournament identifies the surviving preference along each participant's path, not a full pairwise ranking. Use randomized order to reduce systematic order bias.
- Highest-scoring supporting images are not necessarily the most aesthetically coherent six-image collection; consider a follow-up study before calling the Ultra Steam Page optimal.
- Sequential IDs are assigned when valid submissions are saved, not when the page opens. Google Apps Script uses a lock to avoid simultaneous duplicate numbers. Sessions are deduplicated by a random session ID.
- Anonymity is limited by the host's normal access logs; the study itself does not solicit name, email, or free-text responses.
