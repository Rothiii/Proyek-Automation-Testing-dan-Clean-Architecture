import AuthenticationError from '../../../Commons/exceptions/AuthenticationError.js';
import AuthenticationTokenManager from '../../../Applications/security/AuthenticationTokenManager.js';

const createAuthenticationMiddleware = (container) => async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new AuthenticationError('Missing authentication');
    }

    const token = authorization.slice('Bearer '.length);
    const tokenManager = container.getInstance(AuthenticationTokenManager.name);

    let payload;
    try {
      payload = await tokenManager.verifyAccessToken(token);
    } catch {
      throw new AuthenticationError('Invalid authentication');
    }

    if (!payload?.id || !payload?.username) {
      throw new AuthenticationError('Invalid authentication');
    }

    req.user = { id: payload.id, username: payload.username };
    next();
  } catch (error) {
    next(error);
  }
};

export default createAuthenticationMiddleware;
