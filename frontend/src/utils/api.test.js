import { authAPI, getApiErrorMessage } from './api';

const originalFetch = global.fetch;

describe('getApiErrorMessage', () => {
  test.each([
    [{ error: 'Invalid credentials' }, 'Invalid credentials'],
    [{ error: { message: 'Service is temporarily unavailable' } }, 'Service is temporarily unavailable'],
    [{ data: { error: { message: 'Please try again later' } } }, 'Please try again later'],
  ])('reads a public message from %p', (payload, expected) => {
    expect(getApiErrorMessage(payload, 'Login failed')).toBe(expected);
  });

  it('does not expose unsupported internal error fields', () => {
    expect(getApiErrorMessage({
      error: {
        originalMessage: 'database credentials are invalid',
        stack: 'sensitive stack trace',
      },
    }, 'Login failed')).toBe('Login failed');
  });
});

describe('authAPI.login error handling', () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('surfaces the server message instead of [object Object]', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      json: async () => ({
        success: false,
        error: { message: 'Internal server error' },
      }),
    });

    await expect(authAPI.login({
      email: 'student@example.com',
      password: 'password',
    })).rejects.toThrow('Internal server error');
  });
});
