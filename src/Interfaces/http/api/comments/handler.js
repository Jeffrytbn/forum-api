const AddCommentUseCase = require('../../../../Applications/use_case/AddCommentUseCase');
const DeleteCommentUseCase = require('../../../../Applications/use_case/DeleteCommentUseCase');

class CommentsHandler {
  constructor(container) {
    this._container = container;

    this.postCommentHandler = this.postCommentHandler.bind(this);
    this.deleteCommentHandler = this.deleteCommentHandler.bind(this);
  }

  async postCommentHandler(req, res) {
    const { id: owner } = req.auth.credentials;
    const { threadId } = req.params;
    const addCommentUseCase = this._container.getInstance(AddCommentUseCase.name);
    const addedComment = await addCommentUseCase.execute({ ...req.body, threadId, owner });

    res.status(201).json({
      status: 'success',
      data: { addedComment },
    });
  }

  async deleteCommentHandler(req, res) {
    const { id: owner } = req.auth.credentials;
    const { threadId, commentId } = req.params;
    const deleteCommentUseCase = this._container.getInstance(DeleteCommentUseCase.name);
    await deleteCommentUseCase.execute({ threadId, commentId, owner });

    res.status(200).json({
      status: 'success',
    });
  }
}

module.exports = CommentsHandler;
