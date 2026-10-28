import NewThread from '../../Domains/threads/entities/NewThread.js';

class AddThreadUseCase {
  constructor({ threadRepository }) {
    this._threadRepository = threadRepository;
  }

  async execute(useCasePayload) {
    const { owner } = useCasePayload;
    const newThread = new NewThread(useCasePayload);

    return this._threadRepository.addThread({
      title: newThread.title,
      body: newThread.body,
      owner,
    });
  }
}

export default AddThreadUseCase;
