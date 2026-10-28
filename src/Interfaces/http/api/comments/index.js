import CommentsHandler from './handler.js';
import createCommentsRouter from './routes.js';
import createAuthenticationMiddleware from '../../../../Infrastructures/http/middlewares/authentication.js';

export default (container) => {
  const commentsHandler = new CommentsHandler(container);
  const authenticationMiddleware = createAuthenticationMiddleware(container);

  return createCommentsRouter(commentsHandler, authenticationMiddleware);
};
