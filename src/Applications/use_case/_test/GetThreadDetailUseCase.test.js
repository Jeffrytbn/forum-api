const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const CommentRepository = require('../../../Domains/comments/CommentRepository');
const ReplyRepository = require('../../../Domains/replies/ReplyRepository');
const LikeRepository = require('../../../Domains/likes/LikeRepository');
const ThreadDetail = require('../../../Domains/threads/entities/ThreadDetail');
const GetThreadDetailUseCase = require('../GetThreadDetailUseCase');

describe('GetThreadDetailUseCase', () => {
  it('should orchestrate the get thread detail action correctly', async () => {
    const threadRepository = new ThreadRepository();
    const commentRepository = new CommentRepository();
    const replyRepository = new ReplyRepository();
    const likeRepository = new LikeRepository();

    // data mentah dari repository (netral, berbeda dengan hasil akhir yang diharapkan)
    threadRepository.getThreadById = vi.fn(() => Promise.resolve({
      id: 'thread-123',
      title: 'sebuah thread',
      body: 'sebuah body',
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
    }));
    commentRepository.getCommentsByThreadId = vi.fn(() => Promise.resolve([
      {
        id: 'comment-1', username: 'johndoe', date: '2021-08-08T07:22:33.555Z', content: 'komentar pertama', isDelete: false,
      },
      {
        id: 'comment-2', username: 'dicoding', date: '2021-08-08T07:26:21.338Z', content: 'komentar kedua', isDelete: true,
      },
    ]));
    replyRepository.getRepliesByThreadId = vi.fn(() => Promise.resolve([
      {
        id: 'reply-1', commentId: 'comment-1', username: 'dicoding', date: '2021-08-08T07:59:48.766Z', content: 'balasan pertama', isDelete: true,
      },
      {
        id: 'reply-2', commentId: 'comment-1', username: 'johndoe', date: '2021-08-08T08:07:01.522Z', content: 'balasan kedua', isDelete: false,
      },
    ]));

    likeRepository.getLikeCountsByThreadId = vi.fn(() => Promise.resolve([
      { commentId: 'comment-1', likeCount: 2 },
    ]));

    const useCase = new GetThreadDetailUseCase({
      threadRepository, commentRepository, replyRepository, likeRepository,
    });

    const threadDetail = await useCase.execute('thread-123');

    expect(threadDetail).toBeInstanceOf(ThreadDetail);
    expect(threadDetail).toEqual({
      id: 'thread-123',
      title: 'sebuah thread',
      body: 'sebuah body',
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
      comments: [
        {
          id: 'comment-1',
          username: 'johndoe',
          date: '2021-08-08T07:22:33.555Z',
          replies: [
            {
              id: 'reply-1', content: '**balasan telah dihapus**', date: '2021-08-08T07:59:48.766Z', username: 'dicoding',
            },
            {
              id: 'reply-2', content: 'balasan kedua', date: '2021-08-08T08:07:01.522Z', username: 'johndoe',
            },
          ],
          content: 'komentar pertama',
          likeCount: 2,
        },
        {
          id: 'comment-2',
          username: 'dicoding',
          date: '2021-08-08T07:26:21.338Z',
          replies: [],
          content: '**komentar telah dihapus**',
          likeCount: 0,
        },
      ],
    });
    expect(threadRepository.getThreadById).toBeCalledWith('thread-123');
    expect(commentRepository.getCommentsByThreadId).toBeCalledWith('thread-123');
    expect(replyRepository.getRepliesByThreadId).toBeCalledWith('thread-123');
    expect(likeRepository.getLikeCountsByThreadId).toBeCalledWith('thread-123');
  });
});
