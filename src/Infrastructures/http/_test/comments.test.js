import request from 'supertest';
import pool from '../../database/postgres/pool.js';
import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper.js';
import AuthenticationsTableTestHelper from '../../../../tests/AuthenticationsTableTestHelper.js';
import ThreadsTableTestHelper from '../../../../tests/ThreadsTableTestHelper.js';
import CommentsTableTestHelper from '../../../../tests/CommentsTableTestHelper.js';
import container from '../../container.js';
import createServer from '../createServer.js';
import AuthenticationTokenManager from '../../../Applications/security/AuthenticationTokenManager.js';

describe('HTTP server - comments', () => {
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

    accessToken = await container
      .getInstance(AuthenticationTokenManager.name)
      .createAccessToken({ id: 'user-123', username: 'dicoding' });
    otherAccessToken = await container
      .getInstance(AuthenticationTokenManager.name)
      .createAccessToken({ id: 'user-456', username: 'johndoe' });
  });

  afterEach(async () => {
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
    await AuthenticationsTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('POST /threads/:threadId/comments', () => {
    it('should response 401 when authorization header not provided', async () => {
      // Action
      const response = await request(app)
        .post('/threads/thread-123/comments')
        .send({ content: 'sebuah komentar' });

      // Assert
      expect(response.status).toEqual(401);
      expect(response.body.message).toEqual('Missing authentication');
    });

    it('should response 404 when thread not found', async () => {
      // Action
      const response = await request(app)
        .post('/threads/thread-xxx/comments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'sebuah komentar' });

      // Assert
      expect(response.status).toEqual(404);
      expect(response.body.status).toEqual('fail');
    });

    it('should response 400 when payload not contain needed property', async () => {
      // Action
      const response = await request(app)
        .post('/threads/thread-123/comments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      // Assert
      expect(response.status).toEqual(400);
      expect(response.body.message).toEqual('tidak dapat membuat komentar baru karena properti yang dibutuhkan tidak ada');
    });

    it('should response 400 when payload not meet data type specification', async () => {
      // Action
      const response = await request(app)
        .post('/threads/thread-123/comments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 123 });

      // Assert
      expect(response.status).toEqual(400);
      expect(response.body.message).toEqual('tidak dapat membuat komentar baru karena tipe data tidak sesuai');
    });

    it('should response 201 and persisted comment', async () => {
      // Action
      const response = await request(app)
        .post('/threads/thread-123/comments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'sebuah komentar' });

      // Assert
      expect(response.status).toEqual(201);
      expect(response.body.status).toEqual('success');
      expect(response.body.data.addedComment.content).toEqual('sebuah komentar');
      expect(response.body.data.addedComment.owner).toEqual('user-123');

      const comments = await CommentsTableTestHelper.findCommentById(response.body.data.addedComment.id);
      expect(comments).toHaveLength(1);
    });
  });

  describe('DELETE /threads/:threadId/comments/:commentId', () => {
    it('should response 401 when authorization header not provided', async () => {
      // Arrange
      await CommentsTableTestHelper.addComment({ id: 'comment-123' });

      // Action
      const response = await request(app)
        .delete('/threads/thread-123/comments/comment-123');

      // Assert
      expect(response.status).toEqual(401);
      expect(response.body.message).toEqual('Missing authentication');
    });

    it('should response 404 when thread not found', async () => {
      // Arrange
      await CommentsTableTestHelper.addComment({ id: 'comment-123' });

      // Action
      const response = await request(app)
        .delete('/threads/thread-xxx/comments/comment-123')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expect(response.status).toEqual(404);
      expect(response.body.status).toEqual('fail');
    });

    it('should response 404 when comment not found', async () => {
      // Action
      const response = await request(app)
        .delete('/threads/thread-123/comments/comment-xxx')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expect(response.status).toEqual(404);
      expect(response.body.status).toEqual('fail');
    });

    it('should response 403 when comment not owned by user', async () => {
      // Arrange
      await CommentsTableTestHelper.addComment({ id: 'comment-123', owner: 'user-123' });

      // Action
      const response = await request(app)
        .delete('/threads/thread-123/comments/comment-123')
        .set('Authorization', `Bearer ${otherAccessToken}`);

      // Assert
      expect(response.status).toEqual(403);
      expect(response.body.status).toEqual('fail');
    });

    it('should response 200 and soft delete comment', async () => {
      // Arrange
      await CommentsTableTestHelper.addComment({ id: 'comment-123', owner: 'user-123' });

      // Action
      const response = await request(app)
        .delete('/threads/thread-123/comments/comment-123')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.status).toEqual('success');

      const [comment] = await CommentsTableTestHelper.findCommentById('comment-123');
      expect(comment.is_delete).toEqual(true);
    });
  });
});
