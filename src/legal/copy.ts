export const LEGAL_CONTACT_EMAIL = 'calebkimballclark@gmail.com';
export const LEGAL_DEVELOPER_NAME = 'Caleb Clark';
export const LEGAL_APP_NAME = 'Self Forged';
export const LEGAL_EFFECTIVE_DATE = 'October 7, 2026';

export const HEALTH_DISCLAIMER =
  `${LEGAL_APP_NAME} is a personal tracking tool. It is not medical care, diagnosis, treatment, or professional advice. Diet, weight, and workout numbers you enter are for your own logs only. Talk to a qualified professional before starting a diet or exercise program, especially if you have a medical condition.`;

export const PRIVACY_SECTIONS: { title: string; body: string }[] = [
  {
    title: 'Who we are',
    body: `${LEGAL_APP_NAME} is provided by ${LEGAL_DEVELOPER_NAME}. Contact: ${LEGAL_CONTACT_EMAIL}.`,
  },
  {
    title: 'What this app stores',
    body: 'The app stores your diet logs, weight entries, workouts, habits, streaks, and related settings on this device only, using on-device storage. We do not create accounts, and we do not operate a backend that receives your tracking data.',
  },
  {
    title: 'What we do not collect',
    body: 'We do not collect your name, email, location, contacts, photos, payment info, or HealthKit data. We do not sell data. We do not use advertising or analytics SDKs. We do not use your information for tracking across other companies’ apps or websites.',
  },
  {
    title: 'App updates',
    body: 'If you install a version from the App Store that checks for over-the-air updates, the app may contact Expo’s update service to see whether a newer version of the app is available. That request can include technical details such as IP address, device type, OS version, and app version. It is used only to deliver app updates. Your diet, gym, and habit entries are not included in those requests.',
  },
  {
    title: 'Clipboard',
    body: 'If you use Import or Export, the app may copy or paste text you choose. It does not read the clipboard in the background.',
  },
  {
    title: 'Children',
    body: 'The app is not directed at children under 13, and we do not knowingly collect personal information from children.',
  },
  {
    title: 'Your choices',
    body: 'You can export a copy of your local data or delete all local app data from Settings. Uninstalling the app also removes local data from that device. Because data is not stored on our servers, we cannot recover it after it is deleted.',
  },
  {
    title: 'Changes',
    body: `We may update this policy. The effective date is ${LEGAL_EFFECTIVE_DATE}. Continued use after an update means you accept the revised policy.`,
  },
];

export const TERMS_SECTIONS: { title: string; body: string }[] = [
  {
    title: 'The service',
    body: `${LEGAL_APP_NAME} lets you track personal diet, training, and habits on your device. Features may change over time.`,
  },
  {
    title: 'Not medical advice',
    body: HEALTH_DISCLAIMER,
  },
  {
    title: 'Your responsibility',
    body: 'You are responsible for the accuracy of what you log and for how you use the app. Do not use the app in any way that is unlawful or that could harm you or others.',
  },
  {
    title: 'No warranty',
    body: 'The app is provided “as is.” We do not warrant that it will be error-free, uninterrupted, or fit for a particular purpose. To the fullest extent allowed by law, we are not liable for injuries, lost data, or other damages arising from use of the app.',
  },
  {
    title: 'Local data',
    body: 'Your logs live on your device. Keep a backup if that history matters to you. We cannot restore deleted or lost on-device data.',
  },
];
