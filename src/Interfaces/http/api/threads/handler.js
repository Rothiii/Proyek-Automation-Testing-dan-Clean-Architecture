import AddThreadUseCase from '../../../../Applications/use_case/AddThreadUseCase.js';

class ThreadsHandler {
  constructor(container) {
    this._container = container;

    this.postThreadHandler = this.postThreadHandler.bind(this);
  }

  async postThreadHandler(req, res, next) {
    try {
      const addThreadUseCase = this._container.getInstance(AddThreadUseCase.name);
      const addedThread = await addThreadUseCase.execute({
        ...req.body,
        owner: req.user.id,
      });

      res.status(201).json({
        status: 'success',
        data: {
          addedThread,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default ThreadsHandler;
