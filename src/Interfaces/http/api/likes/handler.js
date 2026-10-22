const ToggleLikeUseCase = require('../../../../Applications/use_case/ToggleLikeUseCase');

class LikesHandler {
  constructor(container) {
    this._container = container;

    this.putLikeHandler = this.putLikeHandler.bind(this);
  }

  async putLikeHandler(req, res) {
    const { id: owner } = req.auth.credentials;
    const { threadId, commentId } = req.params;
    const toggleLikeUseCase = this._container.getInstance(ToggleLikeUseCase.name);
    await toggleLikeUseCase.execute({ threadId, commentId, owner });

    res.status(200).json({
      status: 'success',
    });
  }
}

module.exports = LikesHandler;
