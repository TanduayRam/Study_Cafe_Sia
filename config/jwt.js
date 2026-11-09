// The secret text used to sign login tokens, and how long a token lasts.
const secret = process.env.JWT_SECRET || 'dev-only-secret-change-me';

if (!process.env.JWT_SECRET) {
    console.warn('WARNING: JWT_SECRET is not set in .env. Using an insecure development secret.');
}

module.exports = {
    secret: secret,
    expiresIn: process.env.JWT_EXPIRES_IN || '8h'
};
