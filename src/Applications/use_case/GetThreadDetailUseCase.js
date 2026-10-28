const DELETED_COMMENT_CONTENT = '**komentar telah dihapus**';
const DELETED_REPLY_CONTENT = '**balasan telah dihapus**';

class GetThreadDetailUseCase {
  constructor({ threadRepository, commentRepository, replyRepository }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
    this._replyRepository = replyRepository;
  }

  async execute(threadId) {
    await this._threadRepository.verifyThreadExists(threadId);

    const thread = await this._threadRepository.getThreadById(threadId);
    const comments = await this._commentRepository.getCommentsByThreadId(threadId);
    const replies = await this._replyRepository.getRepliesByThreadId(threadId);

    return {
      id: thread.id,
      title: thread.title,
      body: thread.body,
      date: thread.date,
      username: thread.username,
      comments: comments.map((comment) => ({
        id: comment.id,
        username: comment.username,
        date: comment.date,
        content: comment.isDelete ? DELETED_COMMENT_CONTENT : comment.content,
        replies: replies
          .filter((reply) => reply.commentId === comment.id)
          .map((reply) => ({
            id: reply.id,
            username: reply.username,
            date: reply.date,
            content: reply.isDelete ? DELETED_REPLY_CONTENT : reply.content,
          })),
      })),
    };
  }
}

export default GetThreadDetailUseCase;
