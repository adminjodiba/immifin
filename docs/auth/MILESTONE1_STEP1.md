# Milestone 1 — Step 1: Clerk Sign-Up Identity Fields

Clerk is the source of truth for identity. This step requires first name, last name,
email, and password at sign-up. Profile image remains optional.

## Apply instance configuration

From the project root (with Clerk CLI authenticated and the app linked):

```bash
npm run clerk:config:signup
```

Preview without applying:

```bash
npm run clerk:config:signup:dry-run
```

Configuration lives in `config/clerk/sign-up.patch.json`.

## Dashboard fallback

If the CLI is unavailable, configure manually in the [Clerk Dashboard](https://dashboard.clerk.com)
under **User & authentication**:

1. **Email** — enabled, required, verification as configured for your environment.
2. **Password** — enabled, required.
3. **Personal information → Name** — enabled and **required** (first and last name).
4. **Progressive sign-up** — disabled so all fields appear on the initial form.
5. **Profile image** — leave optional (do not mark required).

## Verification

Visit `/signup`. The form should show:

- First Name \*
- Last Name \*
- Email \*
- Password \*
- Upload Profile Photo (Optional)
- Create Account

Submitting without first or last name must be blocked by Clerk client validation.

Login (`/login`), header auth buttons, and webhooks are unchanged by this step.
