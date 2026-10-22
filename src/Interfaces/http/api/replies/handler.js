const AddReplyUseCase = require('../../../../Applications/use_case/AddReplyUseCase');
const DeleteReplyUseCase = require('../../../../Applications/use_case/DeleteReplyUseCase');

class RepliesHandler {
  constructor(container) {
    this._container = container;

    this.postReplyHandler = this.postReplyHandler.bind(this);
    this.deleteReplyHandler = this.deleteReplyHandler.bind(this);
  }

  async postReplyHandler(req, res) {
    const { id: owner } = req.auth.credentials;
    const { threadId, commentId } = req.params;
    const addReplyUseCase = this._container.getInstance(AddReplyUseCase.name);
    const addedReply = await addReplyUseCase.execute({
      ...req.body, threadId, commentId, owner,
    });

    res.status(201).json({
      status: 'success',
      data: { addedReply },
    });
  }

  async deleteReplyHandler(req, res) {
    const { id: owner } = req.auth.credentials;
    const { threadId, commentId, replyId } = req.params;
    const deleteReplyUseCase = this._container.getInstance(DeleteReplyUseCase.name);
    await deleteReplyUseCase.execute({
      threadId, commentId, replyId, owner,
    });

    res.status(200).json({
      status: 'success',
    });
  }
}

module.exports = RepliesHandler;
