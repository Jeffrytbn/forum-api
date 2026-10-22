const AddThreadUseCase = require('../../../../Applications/use_case/AddThreadUseCase');
const GetThreadDetailUseCase = require('../../../../Applications/use_case/GetThreadDetailUseCase');

class ThreadsHandler {
  constructor(container) {
    this._container = container;

    this.postThreadHandler = this.postThreadHandler.bind(this);
    this.getThreadByIdHandler = this.getThreadByIdHandler.bind(this);
  }

  async postThreadHandler(req, res) {
    const { id: owner } = req.auth.credentials;
    const addThreadUseCase = this._container.getInstance(AddThreadUseCase.name);
    const addedThread = await addThreadUseCase.execute({ ...req.body, owner });

    res.status(201).json({
      status: 'success',
      data: { addedThread },
    });
  }

  async getThreadByIdHandler(req, res) {
    const { threadId } = req.params;
    const getThreadDetailUseCase = this._container.getInstance(GetThreadDetailUseCase.name);
    const thread = await getThreadDetailUseCase.execute(threadId);

    res.status(200).json({
      status: 'success',
      data: { thread },
    });
  }
}

module.exports = ThreadsHandler;
