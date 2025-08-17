import '@testing-library/jest-dom';

// Silence Next.js router warnings and provide minimal mocks for navigation
jest.mock('next/navigation', () => {
	const push = jest.fn();
	const replace = jest.fn();
	const back = jest.fn();
	return {
		useRouter: () => ({ push, replace, back }),
		usePathname: () => '/',
		useSearchParams: () => ({ get: jest.fn() }),
	};
});

// Provide a basic localStorage mock for hooks relying on it
class LocalStorageMock {
	private store: Record<string, string> = {};
	clear() { this.store = {}; }
	getItem(key: string) { return this.store[key] ?? null; }
	setItem(key: string, value: string) { this.store[key] = String(value); }
	removeItem(key: string) { delete this.store[key]; }
}

if (typeof window !== 'undefined') {
	// @ts-expect-error - override in tests
	window.localStorage = new LocalStorageMock();
}

import "@testing-library/jest-dom";

// Mock next/navigation hooks used in components
jest.mock("next/navigation", () => {
	const push = jest.fn();
	const replace = jest.fn();
	const back = jest.fn();
	return {
		useRouter: () => ({ push, replace, back }),
		usePathname: () => "/",
	};
});

// Polyfill for ResizeObserver if needed by libraries
// Basic polyfill for ResizeObserver in test env
declare global {
	// minimal typing for tests only
	interface GlobalWithRO {
		ResizeObserver?: new (...args: unknown[]) => unknown;
	}
}

const g = globalThis as unknown as GlobalWithRO;
if (typeof g.ResizeObserver === "undefined") {
	class RO {
		observe() {}
		unobserve() {}
		disconnect() {}
	}
	g.ResizeObserver = RO as unknown as new (...args: unknown[]) => unknown;
}

