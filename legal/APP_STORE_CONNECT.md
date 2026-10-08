# App Store Connect — what to enter

This is an implementation checklist for Apple’s review and privacy forms. It is not legal advice.

Host `legal/privacy-policy.html` on a public HTTPS URL (GitHub Pages, Notion public page, your site). Apple requires that URL in App Store Connect. In-app privacy text matches this file.

## App Information

- **Name:** Ultimate Self Improvement App
- **Subtitle:** Diet, gym, and habit tracker
- **Bundle ID:** `com.caleb.workoutapp`
- **SKU:** something unique, e.g. `usi-001`
- **Primary category:** Health & Fitness
- **Secondary category:** Productivity (optional)
- **Content rights:** You own the content / licensed
- **Age rating:** 4+
  - No unrestricted web access
  - No user-generated public content
  - No violence, gambling, or mature themes
- **Copyright:** 2026 Caleb Clark
- **Privacy Policy URL:** your hosted `privacy-policy.html`
- **Support URL:** same page or a simple contact page with `calebkimballclark@gmail.com`

## App Privacy questionnaire

Answer based on current code (local AsyncStorage + optional Expo updates).

1. **Do you or your third-party partners collect data from this app?**  
   **Yes** — because Expo’s update service may receive technical data when the app checks for updates. Your diet, gym, and habit logs are **not** sent.

2. **Tracking:** **No.** Do not select “Used for Tracking.” Do not show App Tracking Transparency.

3. Data types to declare (not linked to identity, not used for tracking):

   | Type | Select? | Purpose |
   | --- | --- | --- |
   | Health & Fitness (workouts, weight, diet) | **No** | Stays on device only. Apple’s “collect” means data that leaves the device to you or a partner. |
   | Contact Info / Location / Photos / Payments | **No** | |
   | Crash Data | **Yes** | Required because this app uses `expo-updates`. Purpose: App Functionality. Not linked to identity. Not used for tracking. |
   | Product Interaction / Device ID | Optional / Yes if asked for update checks | Same Expo update service. Not linked to identity. |

Expo’s current App Store guidance: if you use `expo-updates`, answer **Yes, we collect data** and select **Crash Data**.

4. **Do not** claim HealthKit. This app does not use HealthKit.

If you later disable Expo Updates in the store binary, you can change question 1 to **No, we do not collect data**.

## Review notes (paste into App Review Information)

```
No account or login. All features work offline after install.
Diet, gym, and habits are stored on device only.
This is a personal tracker, not a medical device and not medical advice.
There are no in-app purchases.
Privacy Policy and Terms are in Settings on the Home tab.
```

## Demo account

Leave blank. There is no login.

## Export compliance

In App Store Connect (or via `ITSAppUsesNonExemptEncryption` already set false in app config):

- Uses standard HTTPS only
- **Exempt** / not using non-exempt encryption

## Screenshots / metadata

- iPhone 6.7" and 6.3"/6.5" required sizes
- Show Home, Diet, Gym, Daily Tasks
- Do not claim “lose weight guaranteed,” medical results, or Health app integration
- Test on iPhone SE and iPad even if phones are the focus

## What you still need outside this repo

1. Paid Apple Developer Program membership ($99/year)
2. Public privacy policy URL
3. Production iOS build: `eas build --platform ios --profile production`
4. Submit: `eas submit --platform ios` then complete App Review in App Store Connect
5. TestFlight internal test before submitting for review
