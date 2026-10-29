import ReplyRepository from '../../Domains/replies/ReplyRepository.js';
import NotFoundError from '../../Commons/exceptions/NotFoundError.js';
import AuthorizationError from '../../Commons/exceptions/AuthorizationError.js';

class ReplyRepositoryPostgres extends ReplyRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
  }

  async addReply({ content, owner, commentId }) {
    const id = `reply-${this._idGenerator()}`;
    const date = new Date().toISOString();

    const query = {
      text: 'INSERT INTO replies (id, content, owner, comment_id, date) VALUES($1, $2, $3, $4, $5) RETURNING id, content, owner',
      values: [id, content, owner, commentId, date],
    };

    const { rows } = await this._pool.query(query);
    return rows[0];
  }

  async verifyReplyExists(replyId) {
    const query = {
      text: 'SELECT id FROM replies WHERE id = $1 AND is_delete = false',
      values: [replyId],
    };

    const { rowCount } = await this._pool.query(query);

    if (!rowCount) {
      throw new NotFoundError('balasan tidak ditemukan');
    }
  }

  async verifyReplyOwner(replyId, owner) {
    const query = {
      text: 'SELECT id, owner FROM replies WHERE id = $1 AND is_delete = false',
      values: [replyId],
    };

    const { rowCount, rows } = await this._pool.query(query);

    if (!rowCount) {
      throw new NotFoundError('balasan tidak ditemukan');
    }

    if (rows[0].owner !== owner) {
      throw new AuthorizationError('anda tidak berhak mengakses resource ini');
    }
  }

  async deleteReply(replyId) {
    const query = {
      text: 'UPDATE replies SET is_delete = true WHERE id = $1',
      values: [replyId],
    };

    await this._pool.query(query);
  }

  async getRepliesByThreadId(threadId) {
    const query = {
      text: `
        SELECT replies.id, replies.comment_id, replies.content, replies.date, replies.is_delete, users.username
        FROM replies
        LEFT JOIN comments ON comments.id = replies.comment_id
        LEFT JOIN users ON users.id = replies.owner
        WHERE comments.thread_id = $1
        ORDER BY replies.date ASC, replies.id ASC
      `,
      values: [threadId],
    };

    const { rows } = await this._pool.query(query);
    return rows;
  }
}

export default ReplyRepositoryPostgres;
