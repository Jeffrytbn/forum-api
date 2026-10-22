const NewThread = require('../../../Domains/threads/entities/NewThread');
const AddedThread = require('../../../Domains/threads/entities/AddedThread');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const AddThreadUseCase = require('../AddThreadUseCase');

describe('AddThreadUseCase', () => {
  it('should orchestrate the add thread action correctly', async () => {
    const useCasePayload = { title: 'sebuah thread', body: 'sebuah body', owner: 'user-123' };
    const threadRepository = new ThreadRepository();
    threadRepository.addThread = vi.fn(() => Promise.resolve(
      new AddedThread({ id: 'thread-123', title: 'sebuah thread', owner: 'user-123' }),
    ));

    const useCase = new AddThreadUseCase({ threadRepository });

    const addedThread = await useCase.execute(useCasePayload);

    expect(addedThread).toStrictEqual(new AddedThread({ id: 'thread-123', title: 'sebuah thread', owner: 'user-123' }));
    expect(threadRepository.addThread).toBeCalledWith(new NewThread(useCasePayload));
  });

  it('should throw error and not persist anything when payload is invalid', async () => {
    const threadRepository = new ThreadRepository();
    threadRepository.addThread = vi.fn();
    const useCase = new AddThreadUseCase({ threadRepository });

    await expect(useCase.execute({ title: 'tanpa body', owner: 'user-123' })).rejects.toThrowError('NEW_THREAD.NOT_CONTAIN_NEEDED_PROPERTY');
    expect(threadRepository.addThread).not.toBeCalled();
  });
});
