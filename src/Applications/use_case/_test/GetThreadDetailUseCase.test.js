import GetThreadDetailUseCase from '../../use_case/GetThreadDetailUseCase.js';
import NotFoundError from '../../../Commons/exceptions/NotFoundError.js';

describe('GetThreadDetailUseCase', () => {
  it('should orchestrating get thread detail action correctly', async () => {
    // Arrange
    const threadId = 'thread-123';

    const mockThreadRepository = {
      verifyThreadExists: vi.fn().mockResolvedValue(),
      getThreadById: vi.fn().mockResolvedValue({
        id: 'thread-123',
        title: 'sebuah thread',
        body: 'sebuah body thread',
        date: '2021-08-08T07:19:09.775Z',
        username: 'dicoding',
      }),
    };

    const mockCommentRepository = {
      getCommentsByThreadId: vi.fn().mockResolvedValue([
        {
          id: 'comment-1',
          content: 'komentar pertama',
          date: '2021-08-08T07:20:09.775Z',
          username: 'johndoe',
          isDelete: false,
        },
        {
          id: 'comment-2',
          content: 'komentar yang sudah dihapus',
          date: '2021-08-08T07:21:09.775Z',
          username: 'dicoding',
          isDelete: true,
        },
      ]),
    };

    const mockReplyRepository = {
      getRepliesByThreadId: vi.fn().mockResolvedValue([
        {
          id: 'reply-1',
          commentId: 'comment-1',
          content: 'balasan pertama',
          date: '2021-08-08T07:22:09.775Z',
          username: 'dicoding',
          isDelete: false,
        },
        {
          id: 'reply-2',
          commentId: 'comment-1',
          content: 'balasan yang sudah dihapus',
          date: '2021-08-08T07:23:09.775Z',
          username: 'johndoe',
          isDelete: true,
        },
      ]),
    };

    const getThreadDetailUseCase = new GetThreadDetailUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      replyRepository: mockReplyRepository,
    });

    // Action
    const thread = await getThreadDetailUseCase.execute(threadId);

    // Assert
    expect(mockThreadRepository.verifyThreadExists).toBeCalledWith(threadId);
    expect(thread).toStrictEqual({
      id: 'thread-123',
      title: 'sebuah thread',
      body: 'sebuah body thread',
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
      comments: [
        {
          id: 'comment-1',
          username: 'johndoe',
          date: '2021-08-08T07:20:09.775Z',
          content: 'komentar pertama',
          replies: [
            {
              id: 'reply-1',
              username: 'dicoding',
              date: '2021-08-08T07:22:09.775Z',
              content: 'balasan pertama',
            },
            {
              id: 'reply-2',
              username: 'johndoe',
              date: '2021-08-08T07:23:09.775Z',
              content: '**balasan telah dihapus**',
            },
          ],
        },
        {
          id: 'comment-2',
          username: 'dicoding',
          date: '2021-08-08T07:21:09.775Z',
          content: '**komentar telah dihapus**',
          replies: [],
        },
      ],
    });
  });

  it('should throw NotFoundError when thread not found', async () => {
    // Arrange
    const getThreadDetailUseCase = new GetThreadDetailUseCase({
      threadRepository: {
        verifyThreadExists: vi.fn().mockRejectedValue(new NotFoundError('thread tidak ditemukan')),
      },
      commentRepository: {},
      replyRepository: {},
    });

    // Action and Assert
    await expect(getThreadDetailUseCase.execute('thread-xxx')).rejects.toThrowError(NotFoundError);
  });
});
