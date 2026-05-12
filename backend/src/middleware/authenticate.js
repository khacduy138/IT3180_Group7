/*
 * Authenticate middleware placeholder.
 *
 * Purpose:
 * - Read JWT token from Authorization header.
 * - Verify token with JWT_SECRET.
 * - Attach decoded user data to req.user.
 * - Return 401 when token is missing, invalid, or expired.
 *
 * TODO:
 * - Import jsonwebtoken.
 * - Parse "Bearer <token>" header.
 * - Verify token.
 * - Set req.user.
 * - Call next().
 */
