const NewReply = require('../../../Domains/replies/entities/NewReply');
const AddedReply = require('../../../Domains/replies/entities/AddedReply');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const CommentRepository = require('../../../Domains/comments/CommentRepository');
const ReplyRepository = require('../../../Domains/replies/ReplyRepository');
const AddReplyUseCase = require('../AddReplyUseCase');

describe('AddReplyUseCase', () => {
  it('should orchestrate the add reply action correctly', async () => {
    const useCasePayload = {
      content: 'sebuah balasan', threadId: 'thread-123', commentId: 'comment-123', owner: 'user-123',
    };
    const threadRepository = new ThreadRepository();
    const commentRepository = new CommentRepository();
    const replyRepository = new ReplyRepository();
    threadRepository.verifyThreadAvailability = vi.fn(() => Promise.resolve());
    commentRepository.verifyCommentAvailability = vi.fn(() => Promise.resolve());
    replyRepository.addReply = vi.fn(() => Promise.resolve(
      new AddedReply({ id: 'reply-123', content: 'sebuah balasan', owner: 'user-123' }),
    ));

    const useCase = new AddReplyUseCase({ threadRepository, commentRepository, replyRepository });

    const addedReply = await useCase.execute(useCasePayload);

    expect(addedReply).toStrictEqual(new AddedReply({ id: 'reply-123', content: 'sebuah balasan', owner: 'user-123' }));
    expect(threadRepository.verifyThreadAvailability).toBeCalledWith('thread-123');
    expect(commentRepository.verifyCommentAvailability).toBeCalledWith('comment-123', 'thread-123');
    expect(replyRepository.addReply).toBeCalledWith(new NewReply({
      content: 'sebuah balasan', commentId: 'comment-123', owner: 'user-123',
    }));
  });

  it('should throw error and not persist anything when payload is invalid', async () => {
    const replyRepository = new ReplyRepository();
    replyRepository.addReply = vi.fn();
    const useCase = new AddReplyUseCase({ replyRepository });

    await expect(useCase.execute({ threadId: 'thread-123', commentId: 'comment-123', owner: 'user-123' }))
      .rejects.toThrowError('NEW_REPLY.NOT_CONTAIN_NEEDED_PROPERTY');
    expect(replyRepository.addReply).not.toBeCalled();
  });
});
