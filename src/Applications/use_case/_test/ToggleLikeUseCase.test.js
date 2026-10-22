const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const CommentRepository = require('../../../Domains/comments/CommentRepository');
const LikeRepository = require('../../../Domains/likes/LikeRepository');
const ToggleLikeUseCase = require('../ToggleLikeUseCase');

describe('ToggleLikeUseCase', () => {
  const payload = { threadId: 'thread-123', commentId: 'comment-123', owner: 'user-123' };

  const buildMocks = (isLiked) => {
    const threadRepository = new ThreadRepository();
    const commentRepository = new CommentRepository();
    const likeRepository = new LikeRepository();
    threadRepository.verifyThreadAvailability = vi.fn(() => Promise.resolve());
    commentRepository.verifyCommentAvailability = vi.fn(() => Promise.resolve());
    likeRepository.verifyLikeExists = vi.fn(() => Promise.resolve(isLiked));
    likeRepository.addLike = vi.fn(() => Promise.resolve());
    likeRepository.deleteLike = vi.fn(() => Promise.resolve());

    return {
      threadRepository,
      commentRepository,
      likeRepository,
      useCase: new ToggleLikeUseCase({ threadRepository, commentRepository, likeRepository }),
    };
  };

  it('should add like when user has not liked the comment', async () => {
    const {
      useCase, threadRepository, commentRepository, likeRepository,
    } = buildMocks(false);

    await useCase.execute(payload);

    expect(threadRepository.verifyThreadAvailability).toBeCalledWith('thread-123');
    expect(commentRepository.verifyCommentAvailability).toBeCalledWith('comment-123', 'thread-123');
    expect(likeRepository.verifyLikeExists).toBeCalledWith('comment-123', 'user-123');
    expect(likeRepository.addLike).toBeCalledWith('comment-123', 'user-123');
    expect(likeRepository.deleteLike).not.toBeCalled();
  });

  it('should delete like when user already liked the comment', async () => {
    const { useCase, likeRepository } = buildMocks(true);

    await useCase.execute(payload);

    expect(likeRepository.verifyLikeExists).toBeCalledWith('comment-123', 'user-123');
    expect(likeRepository.deleteLike).toBeCalledWith('comment-123', 'user-123');
    expect(likeRepository.addLike).not.toBeCalled();
  });

  it('should not touch likes when comment verification fails', async () => {
    const { useCase, commentRepository, likeRepository } = buildMocks(false);
    commentRepository.verifyCommentAvailability = vi.fn(() => Promise.reject(new Error('NOT_FOUND')));

    await expect(useCase.execute(payload)).rejects.toThrowError('NOT_FOUND');
    expect(likeRepository.verifyLikeExists).not.toBeCalled();
    expect(likeRepository.addLike).not.toBeCalled();
    expect(likeRepository.deleteLike).not.toBeCalled();
  });
});
