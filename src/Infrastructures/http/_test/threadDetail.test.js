import request from 'supertest';
import pool from '../../database/postgres/pool.js';
import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper.js';
import AuthenticationsTableTestHelper from '../../../../tests/AuthenticationsTableTestHelper.js';
import ThreadsTableTestHelper from '../../../../tests/ThreadsTableTestHelper.js';
import CommentsTableTestHelper from '../../../../tests/CommentsTableTestHelper.js';
import RepliesTableTestHelper from '../../../../tests/RepliesTableTestHelper.js';
import container from '../../container.js';
import createServer from '../createServer.js';

describe('HTTP server - thread detail', () => {
  let app;

  beforeAll(async () => {
    app = await createServer(container);
  });

  beforeEach(async () => {
    await UsersTableTestHelper.addUser({ id: 'user-123', username: 'dicoding' });
    await UsersTableTestHelper.addUser({ id: 'user-456', username: 'johndoe' });
    await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
  });

  afterEach(async () => {
    await RepliesTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
    await AuthenticationsTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('GET /threads/:threadId', () => {
    it('should response 404 when thread not found', async () => {
      // Action
      const response = await request(app).get('/threads/thread-xxx');

      // Assert
      expect(response.status).toEqual(404);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('thread tidak ditemukan');
    });

    it('should response 200 with empty comments when thread has no comment', async () => {
      // Action
      const response = await request(app).get('/threads/thread-123');

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.status).toEqual('success');
      expect(response.body.data.thread).toStrictEqual({
        id: 'thread-123',
        title: 'sebuah thread',
        body: 'sebuah body thread',
        date: expect.any(String),
        username: 'dicoding',
        comments: [],
      });
    });

    it('should response 200 with comments and nested replies correctly', async () => {
      // Arrange
      await CommentsTableTestHelper.addComment({
        id: 'comment-1',
        content: 'komentar pertama',
        owner: 'user-123',
        threadId: 'thread-123',
        date: '2021-08-08T07:20:09.775Z',
      });
      await CommentsTableTestHelper.addComment({
        id: 'comment-2',
        content: 'komentar dihapus',
        owner: 'user-456',
        threadId: 'thread-123',
        date: '2021-08-08T07:21:09.775Z',
        isDelete: true,
      });
      await RepliesTableTestHelper.addReply({
        id: 'reply-1',
        content: 'balasan pertama',
        owner: 'user-456',
        commentId: 'comment-1',
        date: '2021-08-08T07:22:09.775Z',
      });
      await RepliesTableTestHelper.addReply({
        id: 'reply-2',
        content: 'balasan dihapus',
        owner: 'user-123',
        commentId: 'comment-1',
        date: '2021-08-08T07:23:09.775Z',
        isDelete: true,
      });

      // Action
      const response = await request(app).get('/threads/thread-123');

      // Assert
      expect(response.status).toEqual(200);
      const { thread } = response.body.data;
      expect(thread.comments).toHaveLength(2);
      expect(thread.comments[0]).toStrictEqual({
        id: 'comment-1',
        username: 'dicoding',
        date: '2021-08-08T07:20:09.775Z',
        content: 'komentar pertama',
        replies: [
          {
            id: 'reply-1',
            username: 'johndoe',
            date: '2021-08-08T07:22:09.775Z',
            content: 'balasan pertama',
          },
          {
            id: 'reply-2',
            username: 'dicoding',
            date: '2021-08-08T07:23:09.775Z',
            content: '**balasan telah dihapus**',
          },
        ],
      });
      expect(thread.comments[1]).toStrictEqual({
        id: 'comment-2',
        username: 'johndoe',
        date: '2021-08-08T07:21:09.775Z',
        content: '**komentar telah dihapus**',
        replies: [],
      });
    });
  });
});
