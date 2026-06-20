# Backend

Express server for share links and PDF downloads.

Run locally from this folder:

```bash
npm install
npm run dev
```

For OTP email delivery, set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` in your environment. If the key is missing, the server stays in local-dev mode and returns the OTP in the JSON response for testing.
