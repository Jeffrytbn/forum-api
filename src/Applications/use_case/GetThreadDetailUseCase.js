const ThreadDetail = require('../../Domains/threads/entities/ThreadDetail');
const CommentDetail = require('../../Domains/comments/entities/CommentDetail');
const ReplyDetail = require('../../Domains/replies/entities/ReplyDetail');

class GetThreadDetailUseCase {
  constructor({
    threadRepository, commentRepository, replyRepository, likeRepository,
  }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
    this._replyRepository = replyRepository;
    this._likeRepository = likeRepository;
  }

  async execute(threadId) {
    const thread = await this._threadRepository.getThreadById(threadId);
    const comments = await this._commentRepository.getCommentsByThreadId(threadId);
    const replies = await this._replyRepository.getRepliesByThreadId(threadId);
    const likeCounts = await this._likeRepository.getLikeCountsByThreadId(threadId);

    const commentDetails = comments.map((comment) => new CommentDetail({
      ...comment,
      likeCount: this._getLikeCount(likeCounts, comment.id),
      replies: replies
        .filter((reply) => reply.commentId === comment.id)
        .map((reply) => new ReplyDetail(reply)),
    }));

    return new ThreadDetail({ ...thread, comments: commentDetails });
  }

  _getLikeCount(likeCounts, commentId) {
    const found = likeCounts.find((like) => like.commentId === commentId);

    return found ? found.likeCount : 0;
  }
}

module.exports = GetThreadDetailUseCase;
