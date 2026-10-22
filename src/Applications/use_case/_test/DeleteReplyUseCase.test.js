const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const CommentRepository = require('../../../Domains/comments/CommentRepository');
const ReplyRepository = require('../../../Domains/replies/ReplyRepository');
const DeleteReplyUseCase = require('../DeleteReplyUseCase');

describe('DeleteReplyUseCase', () => {
  const payload = {
    threadId: 'thread-123', commentId: 'comment-123', replyId: 'reply-123', owner: 'user-123',
  };

  it('should orchestrate the delete reply action correctly', async () => {
    const threadRepository = new ThreadRepository();
    const commentRepository = new CommentRepository();
    const replyRepository = new ReplyRepository();
    threadRepository.verifyThreadAvailability = vi.fn(() => Promise.resolve());
    commentRepository.verifyCommentAvailability = vi.fn(() => Promise.resolve());
    replyRepository.verifyReplyAvailability = vi.fn(() => Promise.resolve());
    replyRepository.verifyReplyOwner = vi.fn(() => Promise.resolve());
    replyRepository.deleteReply = vi.fn(() => Promise.resolve());

    const useCase = new DeleteReplyUseCase({ threadRepository, commentRepository, replyRepository });

    await useCase.execute(payload);

    expect(threadRepository.verifyThreadAvailability).toBeCalledWith('thread-123');
    expect(commentRepository.verifyCommentAvailability).toBeCalledWith('comment-123', 'thread-123');
    expect(replyRepository.verifyReplyAvailability).toBeCalledWith('reply-123', 'comment-123');
    expect(replyRepository.verifyReplyOwner).toBeCalledWith('reply-123', 'user-123');
    expect(replyRepository.deleteReply).toBeCalledWith('reply-123');
  });

  it('should not delete reply when owner verification fails', async () => {
    const threadRepository = new ThreadRepository();
    const commentRepository = new CommentRepository();
    const replyRepository = new ReplyRepository();
    threadRepository.verifyThreadAvailability = vi.fn(() => Promise.resolve());
    commentRepository.verifyCommentAvailability = vi.fn(() => Promise.resolve());
    replyRepository.verifyReplyAvailability = vi.fn(() => Promise.resolve());
    replyRepository.verifyReplyOwner = vi.fn(() => Promise.reject(new Error('NOT_OWNER')));
    replyRepository.deleteReply = vi.fn();

    const useCase = new DeleteReplyUseCase({ threadRepository, commentRepository, replyRepository });

    await expect(useCase.execute({ ...payload, owner: 'user-456' })).rejects.toThrowError('NOT_OWNER');
    expect(replyRepository.deleteReply).not.toBeCalled();
  });
});
