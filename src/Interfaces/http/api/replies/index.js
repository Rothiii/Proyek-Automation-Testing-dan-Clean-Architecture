import RepliesHandler from './handler.js';
import createRepliesRouter from './routes.js';
import createAuthenticationMiddleware from '../../../../Infrastructures/http/middlewares/authentication.js';

export default (container) => {
  const repliesHandler = new RepliesHandler(container);
  const authenticationMiddleware = createAuthenticationMiddleware(container);

  return createRepliesRouter(repliesHandler, authenticationMiddleware);
};
