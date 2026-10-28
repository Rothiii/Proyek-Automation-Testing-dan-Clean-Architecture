import request from 'supertest';
import pool from '../../database/postgres/pool.js';
import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper.js';
import AuthenticationsTableTestHelper from '../../../../tests/AuthenticationsTableTestHelper.js';
import ThreadsTableTestHelper from '../../../../tests/ThreadsTableTestHelper.js';
import CommentsTableTestHelper from '../../../../tests/CommentsTableTestHelper.js';
import RepliesTableTestHelper from '../../../../tests/RepliesTableTestHelper.js';
import container from '../../container.js';
import createServer from '../createServer.js';
import AuthenticationTokenManager from '../../../Applications/security/AuthenticationTokenManager.js';

describe('HTTP server - replies', () => {
  let app;
  let accessToken;
  let otherAccessToken;

  beforeAll(async () => {
    app = await createServer(container);
  });

  beforeEach(async () => {
    await UsersTableTestHelper.addUser({ id: 'user-123', username: 'dicoding' });
    await UsersTableTestHelper.addUser({ id: 'user-456', username: 'johndoe' });
    await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
    await CommentsTableTestHelper.addComment({ id: 'comment-123', owner: 'user-123', threadId: 'thread-123' });

    accessToken = await container
      .getInstance(AuthenticationTokenManager.name)
      .createAccessToken({ id: 'user-123', username: 'dicoding' });
    otherAccessToken = await container
      .getInstance(AuthenticationTokenManager.name)
      .createAccessToken({ id: 'user-456', username: 'johndoe' });
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

  describe('POST /threads/:threadId/comments/:commentId/replies', () => {
    it('should response 401 when authorization header not provided', async () => {
      // Action
      const response = await request(app)
        .post('/threads/thread-123/comments/comment-123/replies')
        .send({ content: 'sebuah balasan' });

      // Assert
      expect(response.status).toEqual(401);
      expect(response.body.message).toEqual('Missing authentication');
    });

    it('should response 404 when thread not found', async () => {
      // Action
      const response = await request(app)
        .post('/threads/thread-xxx/comments/comment-123/replies')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'sebuah balasan' });

      // Assert
      expect(response.status).toEqual(404);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('thread tidak ditemukan');
    });

    it('should response 404 when comment not found', async () => {
      // Action
      const response = await request(app)
        .post('/threads/thread-123/comments/comment-xxx/replies')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'sebuah balasan' });

      // Assert
      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('komentar tidak ditemukan');
    });

    it('should response 400 when payload not contain needed property', async () => {
      // Action
      const response = await request(app)
        .post('/threads/thread-123/comments/comment-123/replies')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      // Assert
      expect(response.status).toEqual(400);
      expect(response.body.message).toEqual('tidak dapat membuat balasan baru karena properti yang dibutuhkan tidak ada');
    });

    it('should response 400 when payload not meet data type specification', async () => {
      // Action
      const response = await request(app)
        .post('/threads/thread-123/comments/comment-123/replies')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 123 });

      // Assert
      expect(response.status).toEqual(400);
      expect(response.body.message).toEqual('tidak dapat membuat balasan baru karena tipe data tidak sesuai');
    });

    it('should response 201 and persist reply', async () => {
      // Action
      const response = await request(app)
        .post('/threads/thread-123/comments/comment-123/replies')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'sebuah balasan' });

      // Assert
      expect(response.status).toEqual(201);
      expect(response.body.status).toEqual('success');
      expect(response.body.data.addedReply).toStrictEqual({
        id: expect.any(String),
        content: 'sebuah balasan',
        owner: 'user-123',
      });

      const replies = await RepliesTableTestHelper.findReplyById(response.body.data.addedReply.id);
      expect(replies).toHaveLength(1);
      expect(replies[0].comment_id).toEqual('comment-123');
    });
  });

  describe('DELETE /threads/:threadId/comments/:commentId/replies/:replyId', () => {
    beforeEach(async () => {
      await RepliesTableTestHelper.addReply({ id: 'reply-123', owner: 'user-123', commentId: 'comment-123' });
    });

    it('should response 401 when authorization header not provided', async () => {
      // Action
      const response = await request(app)
        .delete('/threads/thread-123/comments/comment-123/replies/reply-123');

      // Assert
      expect(response.status).toEqual(401);
      expect(response.body.message).toEqual('Missing authentication');
    });

    it('should response 404 when thread not found', async () => {
      // Action
      const response = await request(app)
        .delete('/threads/thread-xxx/comments/comment-123/replies/reply-123')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('thread tidak ditemukan');
    });

    it('should response 404 when reply not found', async () => {
      // Action
      const response = await request(app)
        .delete('/threads/thread-123/comments/comment-123/replies/reply-xxx')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('balasan tidak ditemukan');
    });

    it('should response 403 when user is not the owner', async () => {
      // Action
      const response = await request(app)
        .delete('/threads/thread-123/comments/comment-123/replies/reply-123')
        .set('Authorization', `Bearer ${otherAccessToken}`);

      // Assert
      expect(response.status).toEqual(403);
      expect(response.body.message).toEqual('anda tidak berhak mengakses resource ini');
    });

    it('should response 200 and soft delete reply', async () => {
      // Action
      const response = await request(app)
        .delete('/threads/thread-123/comments/comment-123/replies/reply-123')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.status).toEqual('success');

      const replies = await RepliesTableTestHelper.findReplyById('reply-123');
      expect(replies[0].is_delete).toEqual(true);
    });

    it('should response 404 when reply already deleted', async () => {
      // Arrange
      await request(app)
        .delete('/threads/thread-123/comments/comment-123/replies/reply-123')
        .set('Authorization', `Bearer ${accessToken}`);

      // Action
      const response = await request(app)
        .delete('/threads/thread-123/comments/comment-123/replies/reply-123')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expect(response.status).toEqual(404);
    });
  });
});
