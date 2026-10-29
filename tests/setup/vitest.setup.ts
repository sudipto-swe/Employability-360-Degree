import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from '../mocks/server';
import { cleanup } from '@testing-library/react';

// Start MSW server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Clean up after each test
afterEach(() => {
  server.resetHandlers();
  cleanup(); // Clean up React Testing Library DOM
});

// Close MSW server after all tests
afterAll(() => server.close());
