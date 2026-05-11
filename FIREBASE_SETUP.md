# Firebase Firestore Setup

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Click "Create a project" or "Add project".
3. Enter your project name and follow the setup wizard.
4. Enable Google Analytics if desired.

## 2. Enable Firestore

1. In your Firebase project console, go to "Firestore Database".
2. Click "Create database".
3. Choose a database mode and region.
4. For this app, data is stored in the `days` collection.

## 3. Get Firebase Configuration

1. In your Firebase project console, click the gear icon, then "Project settings".
2. Scroll down to "Your apps".
3. Click the web icon (`</>`) to add a web app.
4. Register your app with a nickname.
5. Copy the Firebase configuration values.

## 4. Update Environment Variables

Open `.env.local` in the project root and add:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your-actual-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-actual-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-actual-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-actual-app-id
```

The app reads these values in `lib/firebase.ts`, following the same pattern as AFMS.

## 5. Security Rules

This app signs in anonymously before reading or writing Firestore. In Firebase Console, open **Firestore Database > Rules** and allow authenticated access to the `days` collection:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /days/{dayId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Also make sure **Authentication > Sign-in method > Anonymous** is enabled.

For local development, Firebase test mode can be used temporarily. For production, tighten rules before sharing the app.

## 6. Run the App

```bash
npm run dev
```
