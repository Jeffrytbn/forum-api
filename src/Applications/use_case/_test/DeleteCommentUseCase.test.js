const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const CommentRepository = require('../../../Domains/comments/CommentRepository');
const DeleteCommentUseCase = require('../DeleteCommentUseCase');

describe('DeleteCommentUseCase', () => {
  it('should orchestrate the delete comment action correctly', async () => {
    const threadRepository = new ThreadRepository();
    const commentRepository = new CommentRepository();
    threadRepository.verifyThreadAvailability = vi.fn(() => Promise.resolve());
    commentRepository.verifyCommentAvailability = vi.fn(() => Promise.resolve());
    commentRepository.verifyCommentOwner = vi.fn(() => Promise.resolve());
    commentRepository.deleteComment = vi.fn(() => Promise.resolve());

    const useCase = new DeleteCommentUseCase({ threadRepository, commentRepository });

    await useCase.execute({ threadId: 'thread-123', commentId: 'comment-123', owner: 'user-123' });

    expect(threadRepository.verifyThreadAvailability).toBeCalledWith('thread-123');
    expect(commentRepository.verifyCommentAvailability).toBeCalledWith('comment-123', 'thread-123');
    expect(commentRepository.verifyCommentOwner).toBeCalledWith('comment-123', 'user-123');
    expect(commentRepository.deleteComment).toBeCalledWith('comment-123');
  });

  it('should not delete comment when owner verification fails', async () => {
    const threadRepository = new ThreadRepository();
    const commentRepository = new CommentRepository();
    threadRepository.verifyThreadAvailability = vi.fn(() => Promise.resolve());
    commentRepository.verifyCommentAvailability = vi.fn(() => Promise.resolve());
    commentRepository.verifyCommentOwner = vi.fn(() => Promise.reject(new Error('NOT_OWNER')));
    commentRepository.deleteComment = vi.fn();

    const useCase = new DeleteCommentUseCase({ threadRepository, commentRepository });

    await expect(useCase.execute({ threadId: 'thread-123', commentId: 'comment-123', owner: 'user-456' })).rejects.toThrowError('NOT_OWNER');
    expect(commentRepository.deleteComment).not.toBeCalled();
  });
});
