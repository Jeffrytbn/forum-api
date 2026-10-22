const NewComment = require('../../../Domains/comments/entities/NewComment');
const AddedComment = require('../../../Domains/comments/entities/AddedComment');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const CommentRepository = require('../../../Domains/comments/CommentRepository');
const AddCommentUseCase = require('../AddCommentUseCase');

describe('AddCommentUseCase', () => {
  it('should orchestrate the add comment action correctly', async () => {
    const useCasePayload = { content: 'sebuah comment', threadId: 'thread-123', owner: 'user-123' };
    const threadRepository = new ThreadRepository();
    const commentRepository = new CommentRepository();
    threadRepository.verifyThreadAvailability = vi.fn(() => Promise.resolve());
    commentRepository.addComment = vi.fn(() => Promise.resolve(
      new AddedComment({ id: 'comment-123', content: 'sebuah comment', owner: 'user-123' }),
    ));

    const useCase = new AddCommentUseCase({ threadRepository, commentRepository });

    const addedComment = await useCase.execute(useCasePayload);

    expect(addedComment).toStrictEqual(new AddedComment({ id: 'comment-123', content: 'sebuah comment', owner: 'user-123' }));
    expect(threadRepository.verifyThreadAvailability).toBeCalledWith('thread-123');
    expect(commentRepository.addComment).toBeCalledWith(new NewComment(useCasePayload));
  });

  it('should throw error and not persist anything when payload is invalid', async () => {
    const threadRepository = new ThreadRepository();
    const commentRepository = new CommentRepository();
    threadRepository.verifyThreadAvailability = vi.fn();
    commentRepository.addComment = vi.fn();
    const useCase = new AddCommentUseCase({ threadRepository, commentRepository });

    await expect(useCase.execute({ threadId: 'thread-123', owner: 'user-123' })).rejects.toThrowError('NEW_COMMENT.NOT_CONTAIN_NEEDED_PROPERTY');
    expect(commentRepository.addComment).not.toBeCalled();
  });
});
