# Pay2Own Web

Next.js site for phone stock, order slips, and the staff order desk.

## Required server environment

- `PAY2OWN_INTAKE_TOKEN`: Existing Pay2Own backend credential used for API calls and to sign the admin session cookie.
- `PAY2OWN_ADMIN_EMAILS`: Comma-separated list of authorized administrator email addresses.
- `PAY2OWN_ADMIN_PASSWORD_HASH`: A scrypt password hash in `salt:hex-hash` format.

Generate the password hash locally (do not commit the password or output):

```sh
node -e 'const {randomBytes,scryptSync}=require("node:crypto"); const password=process.argv[1]; if (!password || password.length<10) throw Error("Use a password of at least 10 characters"); const salt=randomBytes(24).toString("hex"); console.log(salt+":"+scryptSync(password,salt,64).toString("hex"))' 'CHOOSE-A-STRONG-PASSWORD'
```

Store the resulting hash as `PAY2OWN_ADMIN_PASSWORD_HASH` in the hosting provider's secret/environment settings. Configure `PAY2OWN_ADMIN_EMAILS` and `PAY2OWN_INTAKE_TOKEN` in the same environment. Use a unique, strong password and rotate the hash if it is compromised. All listed administrators currently share this password; this is not yet a multi-user identity provider.

Admin signup is deliberately disabled. Until all three variables are configured, the admin sign-in route fails closed. The password hash must never be exposed as a `NEXT_PUBLIC_*` environment variable.

## CI and deployment

GitHub Actions verifies TypeScript and the Next.js production build for every pull request. The Vercel deployment step requires the repository secret `VERCEL_TOKEN`; when the secret is missing, GitHub Actions reports deployment as skipped while still verifying the application build. This **does not** publish the site. Verify that `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, and the Vercel scope point to the intended Pay2Own project before enabling deployment.
