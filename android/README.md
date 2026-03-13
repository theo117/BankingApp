# Android wrapper

This folder contains a native Android shell for the existing Next.js demo bank.

## How it works

- The Android app loads the hosted Next.js app inside a `WebView`.
- Login cookies continue to work inside the app.
- CSV statement downloads are handed off to Android's `DownloadManager`.
- External links open outside the app.

## Important constraint

The current banking demo is **not** a static frontend. It depends on:

- Next.js server actions
- cookie-based sessions
- Node's built-in SQLite runtime

That means the Android app must point at a running server. It does **not** run the full banking stack on-device.

## Configure the URL

Default URL:

```properties
http://10.0.2.2:3000
```

That default works for an Android emulator while the Next app is running on your computer with `npm run dev`.

To change it for production or a phone on your network, edit:

`android/gradle.properties`

Set:

```properties
bankingBaseUrl=https://your-hosted-demo.example.com
```

You can also override it at build time:

```bash
./gradlew assembleDebug -PbankingBaseUrl=https://your-hosted-demo.example.com
```

## Open in Android Studio

1. Open the `android/` folder in Android Studio.
2. Let Android Studio create/sync the Gradle wrapper if it prompts you.
3. Confirm `bankingBaseUrl` points at a reachable server.
4. Run the `app` configuration on an emulator or Android device.

## Local development

1. From the project root, start the web app:

```bash
npm run dev
```

2. Start the Android emulator.
3. Run the Android app from Android Studio.

The emulator should load `http://10.0.2.2:3000`, which maps back to your computer's localhost.
