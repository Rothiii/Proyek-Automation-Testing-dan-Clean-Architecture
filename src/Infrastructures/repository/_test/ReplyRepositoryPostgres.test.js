import pool from '../../database/postgres/pool.js';
import ReplyRepositoryPostgres from '../ReplyRepositoryPostgres.js';
import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper.js';
import ThreadsTableTestHelper from '../../../../tests/ThreadsTableTestHelper.js';
import CommentsTableTestHelper from '../../../../tests/CommentsTableTestHelper.js';
import RepliesTableTestHelper from '../../../../tests/RepliesTableTestHelper.js';
import NotFoundError from '../../../Commons/exceptions/NotFoundError.js';
import AuthorizationError from '../../../Commons/exceptions/AuthorizationError.js';

describe('ReplyRepositoryPostgres', () => {
  beforeEach(async () => {
    await UsersTableTestHelper.addUser({ id: 'user-123', username: 'dicoding' });
    await UsersTableTestHelper.addUser({ id: 'user-456', username: 'johndoe' });
    await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
    await CommentsTableTestHelper.addComment({ id: 'comment-123', owner: 'user-123', threadId: 'thread-123' });
  });

  afterEach(async () => {
    await RepliesTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('addReply function', () => {
    it('should persist reply and return added reply correctly', async () => {
      // Arrange
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, () => '123');

      // Action
      const addedReply = await replyRepositoryPostgres.addReply({
        content: 'sebuah balasan',
        owner: 'user-123',
        commentId: 'comment-123',
      });

      // Assert
      expect(addedReply).toStrictEqual({
        id: 'reply-123',
        content: 'sebuah balasan',
        owner: 'user-123',
      });

      const replies = await RepliesTableTestHelper.findReplyById('reply-123');
      expect(replies).toHaveLength(1);
    });
  });

  describe('verifyReplyExists function', () => {
    it('should not throw error when reply exists', async () => {
      // Arrange
      await RepliesTableTestHelper.addReply({ id: 'reply-123', owner: 'user-123', commentId: 'comment-123' });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, () => '123');

      // Action and Assert
      await expect(replyRepositoryPostgres.verifyReplyExists('reply-123')).resolves.not.toThrowError();
    });

    it('should throw NotFoundError when reply not found', async () => {
      // Arrange
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, () => '123');

      // Action and Assert
      await expect(replyRepositoryPostgres.verifyReplyExists('reply-xxx'))
        .rejects.toThrowError(new NotFoundError('balasan tidak ditemukan'));
    });

    it('should throw NotFoundError when reply already deleted', async () => {
      // Arrange
      await RepliesTableTestHelper.addReply({ id: 'reply-123', owner: 'user-123', commentId: 'comment-123', isDelete: true });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, () => '123');

      // Action and Assert
      await expect(replyRepositoryPostgres.verifyReplyExists('reply-123'))
        .rejects.toThrowError(new NotFoundError('balasan tidak ditemukan'));
    });
  });

  describe('verifyReplyOwner function', () => {
    it('should not throw error when owner matched', async () => {
      // Arrange
      await RepliesTableTestHelper.addReply({ id: 'reply-123', owner: 'user-123', commentId: 'comment-123' });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, () => '123');

      // Action and Assert
      await expect(replyRepositoryPostgres.verifyReplyOwner('reply-123', 'user-123')).resolves.not.toThrowError();
    });

    it('should throw AuthorizationError when owner not matched', async () => {
      // Arrange
      await RepliesTableTestHelper.addReply({ id: 'reply-123', owner: 'user-123', commentId: 'comment-123' });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, () => '123');

      // Action and Assert
      await expect(replyRepositoryPostgres.verifyReplyOwner('reply-123', 'user-456'))
        .rejects.toThrowError(new AuthorizationError('anda tidak berhak mengakses resource ini'));
    });

    it('should throw NotFoundError when reply not found', async () => {
      // Arrange
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, () => '123');

      // Action and Assert
      await expect(replyRepositoryPostgres.verifyReplyOwner('reply-xxx', 'user-123'))
        .rejects.toThrowError(new NotFoundError('balasan tidak ditemukan'));
    });
  });

  describe('deleteReply function', () => {
    it('should soft delete reply correctly', async () => {
      // Arrange
      await RepliesTableTestHelper.addReply({ id: 'reply-123', owner: 'user-123', commentId: 'comment-123' });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, () => '123');

      // Action
      await replyRepositoryPostgres.deleteReply('reply-123');

      // Assert
      const replies = await RepliesTableTestHelper.findReplyById('reply-123');
      expect(replies[0].is_delete).toEqual(true);
    });
  });

  describe('getRepliesByThreadId function', () => {
    it('should return replies with username ordered by date', async () => {
      // Arrange
      await RepliesTableTestHelper.addReply({
        id: 'reply-1', content: 'balasan satu', owner: 'user-123', commentId: 'comment-123', date: '2021-08-08T07:20:09.775Z',
      });
      await RepliesTableTestHelper.addReply({
        id: 'reply-2', content: 'balasan dua', owner: 'user-456', commentId: 'comment-123', date: '2021-08-08T07:22:09.775Z', isDelete: true,
      });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, () => '123');

      // Action
      const replies = await replyRepositoryPostgres.getRepliesByThreadId('thread-123');

      // Assert
      expect(replies).toHaveLength(2);
      expect(replies[0]).toStrictEqual({
        id: 'reply-1',
        commentId: 'comment-123',
        content: 'balasan satu',
        date: '2021-08-08T07:20:09.775Z',
        username: 'dicoding',
        isDelete: false,
      });
      expect(replies[1]).toStrictEqual({
        id: 'reply-2',
        commentId: 'comment-123',
        content: 'balasan dua',
        date: '2021-08-08T07:22:09.775Z',
        username: 'johndoe',
        isDelete: true,
      });
    });

    it('should return empty array when thread has no reply', async () => {
      // Arrange
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, () => '123');

      // Action
      const replies = await replyRepositoryPostgres.getRepliesByThreadId('thread-123');

      // Assert
      expect(replies).toHaveLength(0);
    });
  });
});
