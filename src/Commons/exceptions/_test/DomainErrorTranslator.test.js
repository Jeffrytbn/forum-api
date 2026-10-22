const DomainErrorTranslator = require('../DomainErrorTranslator');
const InvariantError = require('../InvariantError');

describe('DomainErrorTranslator', () => {
  it('should translate every domain error code to InvariantError', () => {
    const codes = Object.keys(DomainErrorTranslator._directories);

    expect(codes.length).toBeGreaterThan(0);
    codes.forEach((code) => {
      const translated = DomainErrorTranslator.translate(new Error(code));
      expect(translated).toBeInstanceOf(InvariantError);
      expect(translated.message).not.toEqual('');
    });
  });

  it('should translate specific error messages correctly', () => {
    expect(DomainErrorTranslator.translate(new Error('NEW_THREAD.NOT_CONTAIN_NEEDED_PROPERTY')))
      .toStrictEqual(new InvariantError('tidak dapat membuat thread baru karena properti yang dibutuhkan tidak ada'));
    expect(DomainErrorTranslator.translate(new Error('NEW_REPLY.NOT_MEET_DATA_TYPE_SPECIFICATION')))
      .toStrictEqual(new InvariantError('tidak dapat membuat balasan baru karena tipe data tidak sesuai'));
  });

  it('should return original error when error message is not needed to translate', () => {
    const error = new Error('some_error_message');

    expect(DomainErrorTranslator.translate(error)).toStrictEqual(error);
  });
});
