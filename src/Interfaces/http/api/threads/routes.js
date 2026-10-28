import express from 'express';

const createThreadsRouter = (handler, authenticationMiddleware) => {
  const router = express.Router();

  router.post('/', authenticationMiddleware, handler.postThreadHandler);

  return router;
};

export default createThreadsRouter;
