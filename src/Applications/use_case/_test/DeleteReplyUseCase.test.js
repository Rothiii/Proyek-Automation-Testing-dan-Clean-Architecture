import DeleteReplyUseCase from '../../use_case/DeleteReplyUseCase.js';
import NotFoundError from '../../../Commons/exceptions/NotFoundError.js';
import AuthorizationError from '../../../Commons/exceptions/AuthorizationError.js';

describe('DeleteReplyUseCase', () => {
  it('should orchestrating the delete reply action correctly', async () => {
    // Arrange
    const useCasePayload = {
      threadId: 'thread-123',
      commentId: 'comment-123',
      replyId: 'reply-123',
      owner: 'user-123',
    };

    const mockReplyRepository = {
      verifyReplyExists: vi.fn().mockResolvedValue(),
      verifyReplyOwner: vi.fn().mockResolvedValue(),
      deleteReply: vi.fn().mockResolvedValue(),
    };
    const mockCommentRepository = {
      verifyCommentExists: vi.fn().mockResolvedValue(),
    };
    const mockThreadRepository = {
      verifyThreadExists: vi.fn().mockResolvedValue(),
    };

    const deleteReplyUseCase = new DeleteReplyUseCase({
      replyRepository: mockReplyRepository,
      commentRepository: mockCommentRepository,
      threadRepository: mockThreadRepository,
    });

    // Action
    await deleteReplyUseCase.execute(useCasePayload);

    // Assert
    expect(mockThreadRepository.verifyThreadExists).toBeCalledWith('thread-123');
    expect(mockCommentRepository.verifyCommentExists).toBeCalledWith('comment-123');
    expect(mockReplyRepository.verifyReplyExists).toBeCalledWith('reply-123');
    expect(mockReplyRepository.verifyReplyOwner).toBeCalledWith('reply-123', 'user-123');
    expect(mockReplyRepository.deleteReply).toBeCalledWith('reply-123');
  });

  it('should throw NotFoundError when thread not found', async () => {
    // Arrange
    const deleteReplyUseCase = new DeleteReplyUseCase({
      replyRepository: {},
      commentRepository: {},
      threadRepository: {
        verifyThreadExists: vi.fn().mockRejectedValue(new NotFoundError('thread tidak ditemukan')),
      },
    });

    // Action and Assert
    await expect(deleteReplyUseCase.execute({
      threadId: 'thread-xxx',
      commentId: 'comment-123',
      replyId: 'reply-123',
      owner: 'user-123',
    })).rejects.toThrowError(NotFoundError);
  });

  it('should throw NotFoundError when reply not found', async () => {
    // Arrange
    const deleteReplyUseCase = new DeleteReplyUseCase({
      replyRepository: {
        verifyReplyExists: vi.fn().mockRejectedValue(new NotFoundError('balasan tidak ditemukan')),
      },
      commentRepository: {
        verifyCommentExists: vi.fn().mockResolvedValue(),
      },
      threadRepository: {
        verifyThreadExists: vi.fn().mockResolvedValue(),
      },
    });

    // Action and Assert
    await expect(deleteReplyUseCase.execute({
      threadId: 'thread-123',
      commentId: 'comment-123',
      replyId: 'reply-xxx',
      owner: 'user-123',
    })).rejects.toThrowError(NotFoundError);
  });

  it('should throw AuthorizationError when reply owner mismatch', async () => {
    // Arrange
    const deleteReplyUseCase = new DeleteReplyUseCase({
      replyRepository: {
        verifyReplyExists: vi.fn().mockResolvedValue(),
        verifyReplyOwner: vi.fn().mockRejectedValue(new AuthorizationError('anda tidak berhak mengakses resource ini')),
      },
      commentRepository: {
        verifyCommentExists: vi.fn().mockResolvedValue(),
      },
      threadRepository: {
        verifyThreadExists: vi.fn().mockResolvedValue(),
      },
    });

    // Action and Assert
    await expect(deleteReplyUseCase.execute({
      threadId: 'thread-123',
      commentId: 'comment-123',
      replyId: 'reply-123',
      owner: 'user-456',
    })).rejects.toThrowError(AuthorizationError);
  });
});
