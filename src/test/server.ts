import { setupServer } from 'msw/node'

/**
 * server — shared MSW server instance for all tests. Starts with no default
 * handlers; each test registers the handlers it needs via `server.use(...)`.
 */
export const server = setupServer()
