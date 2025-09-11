## Project setup

```bash
$ yarn install
```

## Compile and run the project

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Google OAuth Login

Set the following environment variables (e.g. in a `.env` file) and restart the server:

```
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Optional cookie/auth tuning
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
OAUTH_SUCCESS_REDIRECT_URL=http://localhost:3000/
```

Endpoints:

- GET `/auth/google` starts the Google login flow (redirects to Google)
- GET `/auth/google/callback` is the OAuth callback; on success it sets `accessToken` and `refreshToken` cookies and redirects to `OAUTH_SUCCESS_REDIRECT_URL` if set

Notes:

- New users logging in with Google are auto-created using their Google email.
- You can then call protected endpoints using the cookies (see `/auth/me`).

## Run tests

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```
