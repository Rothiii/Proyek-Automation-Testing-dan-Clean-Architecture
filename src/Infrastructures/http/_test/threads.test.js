import request from 'supertest';
import pool from '../../database/postgres/pool.js';
import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper.js';
import AuthenticationsTableTestHelper from '../../../../tests/AuthenticationsTableTestHelper.js';
import ThreadsTableTestHelper from '../../../../tests/ThreadsTableTestHelper.js';
import container from '../../container.js';
import createServer from '../createServer.js';
import AuthenticationTokenManager from '../../../Applications/security/AuthenticationTokenManager.js';

describe('HTTP server - threads', () => {
  let app;
  let accessToken;

  beforeAll(async () => {
    app = await createServer(container);
  });

  beforeEach(async () => {
    await UsersTableTestHelper.addUser({ id: 'user-123', username: 'dicoding' });
    accessToken = await container
      .getInstance(AuthenticationTokenManager.name)
      .createAccessToken({ id: 'user-123', username: 'dicoding' });
  });

  afterEach(async () => {
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
    await AuthenticationsTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('POST /threads', () => {
    it('should response 401 when authorization header not provided', async () => {
      // Action
      const response = await request(app)
        .post('/threads')
        .send({ title: 'sebuah thread', body: 'sebuah body thread' });

      // Assert
      expect(response.status).toEqual(401);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('Missing authentication');
    });

    it('should response 401 when authorization header is not bearer token', async () => {
      // Action
      const response = await request(app)
        .post('/threads')
        .set('Authorization', accessToken)
        .send({ title: 'sebuah thread', body: 'sebuah body thread' });

      // Assert
      expect(response.status).toEqual(401);
      expect(response.body.message).toEqual('Missing authentication');
    });

    it('should response 401 when access token is invalid', async () => {
      // Action
      const response = await request(app)
        .post('/threads')
        .set('Authorization', 'Bearer invalid_token')
        .send({ title: 'sebuah thread', body: 'sebuah body thread' });

      // Assert
      expect(response.status).toEqual(401);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('Invalid authentication');
    });

    it('should response 401 when access token payload is incomplete', async () => {
      // Arrange
      const token = await container
        .getInstance(AuthenticationTokenManager.name)
        .createAccessToken({ username: 'dicoding' });

      // Action
      const response = await request(app)
        .post('/threads')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'sebuah thread', body: 'sebuah body thread' });

      // Assert
      expect(response.status).toEqual(401);
      expect(response.body.message).toEqual('Invalid authentication');
    });

    it('should response 201 and persisted thread', async () => {
      // Action
      const response = await request(app)
        .post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'sebuah thread', body: 'sebuah body thread' });

      // Assert
      expect(response.status).toEqual(201);
      expect(response.body.status).toEqual('success');
      expect(response.body.data.addedThread).toBeDefined();

      const { id } = response.body.data.addedThread;
      const threads = await ThreadsTableTestHelper.findThreadById(id);
      expect(threads).toHaveLength(1);
    });

    it('should response 400 when request payload not contain needed property', async () => {
      // Action
      const response = await request(app)
        .post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'sebuah thread' });

      // Assert
      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('tidak dapat membuat thread baru karena properti yang dibutuhkan tidak ada');
    });

    it('should response 400 when request payload not meet data type specification', async () => {
      // Action
      const response = await request(app)
        .post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'sebuah thread', body: 123 });

      // Assert
      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('tidak dapat membuat thread baru karena tipe data tidak sesuai');
    });
  });
});
