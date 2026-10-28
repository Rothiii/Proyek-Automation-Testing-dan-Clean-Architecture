import AddReplyUseCase from '../../use_case/AddReplyUseCase.js';

describe('AddReplyUseCase', () => {
  it('should orchestrating the add reply action correctly', async () => {
    // Arrange
    const useCasePayload = {
      content: 'sebuah balasan',
      threadId: 'thread-123',
      commentId: 'comment-123',
      owner: 'user-123',
    };

    const mockReplyRepository = {
      addReply: vi.fn().mockResolvedValue({
        id: 'reply-123',
        content: 'sebuah balasan',
        owner: 'user-123',
      }),
    };

    const mockCommentRepository = {
      verifyCommentExists: vi.fn().mockResolvedValue(),
    };

    const mockThreadRepository = {
      verifyThreadExists: vi.fn().mockResolvedValue(),
    };

    const addReplyUseCase = new AddReplyUseCase({
      replyRepository: mockReplyRepository,
      commentRepository: mockCommentRepository,
      threadRepository: mockThreadRepository,
    });

    // Action
    const addedReply = await addReplyUseCase.execute(useCasePayload);

    // Assert
    expect(addedReply).toEqual({
      id: 'reply-123',
      content: 'sebuah balasan',
      owner: 'user-123',
    });
    expect(mockThreadRepository.verifyThreadExists).toBeCalledWith('thread-123');
    expect(mockCommentRepository.verifyCommentExists).toBeCalledWith('comment-123');
    expect(mockReplyRepository.addReply).toBeCalledWith({
      content: 'sebuah balasan',
      owner: 'user-123',
      commentId: 'comment-123',
    });
  });

  it('should throw error when payload does not meet data type specification', async () => {
    // Arrange
    const addReplyUseCase = new AddReplyUseCase({
      replyRepository: {},
      commentRepository: {},
      threadRepository: {},
    });

    // Action and Assert
    await expect(addReplyUseCase.execute({
      content: 123,
      threadId: 'thread-123',
      commentId: 'comment-123',
      owner: 'user-123',
    })).rejects.toThrowError('NEW_REPLY.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });
});
