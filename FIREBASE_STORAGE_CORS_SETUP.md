# Firebase Storage CORS Configuration

## Quick Fix for CORS Error

To fix the Firebase Storage CORS error when uploading I9 forms, run this command:

```bash
gsutil cors set cors.json gs://onboarding-tracker-c16cc.firebasestorage.app
```

## Prerequisites

1. Install Google Cloud SDK if not already installed:
   - Windows: Download from https://cloud.google.com/sdk/docs/install
   - Mac: `brew install google-cloud-sdk`
   - Linux: Follow https://cloud.google.com/sdk/docs/install#linux

2. Authenticate with Firebase:
   ```bash
   gcloud auth login
   ```

3. Set your project:
   ```bash
   gcloud config set project onboarding-tracker-c16cc
   ```

## Alternative Method (Using Firebase CLI)

If you prefer using Firebase CLI:

```bash
firebase init hosting
firebase deploy --only hosting
```

## Verify CORS Configuration

To check current CORS settings:
```bash
gsutil cors get gs://onboarding-tracker-c16cc.firebasestorage.app
```

## Troubleshooting

If you still get CORS errors:
1. Clear browser cache
2. Try incognito/private mode
3. Ensure the storage bucket name is correct in firebase.ts
4. Check Firebase console for any security rule issues 