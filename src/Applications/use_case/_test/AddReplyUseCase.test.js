import AddReplyUseCase from '../../use_case/AddReplyUseCase.js';
import AddedReply from '../../../Domains/replies/entities/AddedReply.js';

describe('AddReplyUseCase', () => {
  it('should orchestrating the add reply action correctly', async () => {
    // Arrange
    const useCasePayload = {
      content: 'sebuah balasan',
      threadId: 'thread-123',
      commentId: 'comment-123',
      owner: 'user-123',
    };

    const mockAddedReply = {
      id: 'reply-999',
      content: 'balasan dari repository',
      owner: 'user-999',
    };

    const mockReplyRepository = {
      addReply: vi.fn().mockResolvedValue(mockAddedReply),
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
    expect(addedReply).toStrictEqual(new AddedReply({
      id: 'reply-999',
      content: 'balasan dari repository',
      owner: 'user-999',
    }));
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
