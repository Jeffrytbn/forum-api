/* istanbul ignore file */
const { createContainer } = require('instances-container');
const { nanoid } = require('nanoid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../database/postgres/pool');

const UserRepository = require('../../Domains/users/UserRepository');
const AuthenticationRepository = require('../../Domains/authentications/AuthenticationRepository');
const ThreadRepository = require('../../Domains/threads/ThreadRepository');
const CommentRepository = require('../../Domains/comments/CommentRepository');
const ReplyRepository = require('../../Domains/replies/ReplyRepository');
const LikeRepository = require('../../Domains/likes/LikeRepository');
const PasswordHash = require('../../Applications/security/PasswordHash');
const AuthenticationTokenManager = require('../../Applications/security/AuthenticationTokenManager');

const UserRepositoryPostgres = require('../repository/UserRepositoryPostgres');
const AuthenticationRepositoryPostgres = require('../repository/AuthenticationRepositoryPostgres');
const ThreadRepositoryPostgres = require('../repository/ThreadRepositoryPostgres');
const CommentRepositoryPostgres = require('../repository/CommentRepositoryPostgres');
const ReplyRepositoryPostgres = require('../repository/ReplyRepositoryPostgres');
const LikeRepositoryPostgres = require('../repository/LikeRepositoryPostgres');
const BcryptPasswordHash = require('../security/BcryptPasswordHash');
const JwtTokenManager = require('../security/JwtTokenManager');

const AddUserUseCase = require('../../Applications/use_case/AddUserUseCase');
const LoginUserUseCase = require('../../Applications/use_case/LoginUserUseCase');
const RefreshAuthenticationUseCase = require('../../Applications/use_case/RefreshAuthenticationUseCase');
const LogoutUserUseCase = require('../../Applications/use_case/LogoutUserUseCase');
const AddThreadUseCase = require('../../Applications/use_case/AddThreadUseCase');
const GetThreadDetailUseCase = require('../../Applications/use_case/GetThreadDetailUseCase');
const AddCommentUseCase = require('../../Applications/use_case/AddCommentUseCase');
const DeleteCommentUseCase = require('../../Applications/use_case/DeleteCommentUseCase');
const AddReplyUseCase = require('../../Applications/use_case/AddReplyUseCase');
const DeleteReplyUseCase = require('../../Applications/use_case/DeleteReplyUseCase');
const ToggleLikeUseCase = require('../../Applications/use_case/ToggleLikeUseCase');

const container = createContainer();

// ---- services (repository, hash, token) ----
const withPoolAndIdGenerator = {
  dependencies: [{ concrete: pool }, { concrete: nanoid }],
};

container.register([
  { key: UserRepository.name, Class: UserRepositoryPostgres, parameter: withPoolAndIdGenerator },
  { key: ThreadRepository.name, Class: ThreadRepositoryPostgres, parameter: withPoolAndIdGenerator },
  { key: CommentRepository.name, Class: CommentRepositoryPostgres, parameter: withPoolAndIdGenerator },
  { key: ReplyRepository.name, Class: ReplyRepositoryPostgres, parameter: withPoolAndIdGenerator },
  {
    key: LikeRepository.name,
    Class: LikeRepositoryPostgres,
    parameter: { dependencies: [{ concrete: pool }] },
  },
  {
    key: AuthenticationRepository.name,
    Class: AuthenticationRepositoryPostgres,
    parameter: { dependencies: [{ concrete: pool }] },
  },
  {
    key: PasswordHash.name,
    Class: BcryptPasswordHash,
    parameter: { dependencies: [{ concrete: bcrypt }] },
  },
  {
    key: AuthenticationTokenManager.name,
    Class: JwtTokenManager,
    parameter: { dependencies: [{ concrete: jwt }] },
  },
]);

// ---- use cases ----
const dependency = (name, Interface) => ({ name, internal: Interface.name });

const userRepository = dependency('userRepository', UserRepository);
const authenticationRepository = dependency('authenticationRepository', AuthenticationRepository);
const authenticationTokenManager = dependency('authenticationTokenManager', AuthenticationTokenManager);
const passwordHash = dependency('passwordHash', PasswordHash);
const threadRepository = dependency('threadRepository', ThreadRepository);
const commentRepository = dependency('commentRepository', CommentRepository);
const replyRepository = dependency('replyRepository', ReplyRepository);
const likeRepository = dependency('likeRepository', LikeRepository);

const useCase = (Class, dependencies) => ({
  key: Class.name,
  Class,
  parameter: { injectType: 'destructuring', dependencies },
});

container.register([
  useCase(AddUserUseCase, [userRepository, passwordHash]),
  useCase(LoginUserUseCase, [userRepository, authenticationRepository, authenticationTokenManager, passwordHash]),
  useCase(RefreshAuthenticationUseCase, [authenticationRepository, authenticationTokenManager]),
  useCase(LogoutUserUseCase, [authenticationRepository]),
  useCase(AddThreadUseCase, [threadRepository]),
  useCase(GetThreadDetailUseCase, [threadRepository, commentRepository, replyRepository, likeRepository]),
  useCase(AddCommentUseCase, [threadRepository, commentRepository]),
  useCase(DeleteCommentUseCase, [threadRepository, commentRepository]),
  useCase(AddReplyUseCase, [threadRepository, commentRepository, replyRepository]),
  useCase(DeleteReplyUseCase, [threadRepository, commentRepository, replyRepository]),
  useCase(ToggleLikeUseCase, [threadRepository, commentRepository, likeRepository]),
]);

module.exports = container;
