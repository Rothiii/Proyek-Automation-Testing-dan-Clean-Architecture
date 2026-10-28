import express from 'express';

const createThreadsRouter = (handler, authenticationMiddleware) => {
  const router = express.Router();

  router.post('/', authenticationMiddleware, handler.postThreadHandler);
  router.get('/:threadId', handler.getThreadByIdHandler);

  return router;
};

export default createThreadsRouter;
