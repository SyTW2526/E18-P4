import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

setupZoneTestEnv();

// Minimal jasmine shim so existing specs using jasmine.createSpy keep working in Jest
// Maps to jest.fn() and adds a Jasmine-like calls.reset()
(global as any).jasmine = (global as any).jasmine || {};
(global as any).jasmine.createSpy = (name?: string) => {
	const spy: any = jest.fn();
	spy.and = {
		callFake: (fn: any) => spy.mockImplementation(fn),
		returnValue: (val: any) => {
			spy.mockReturnValue(val);
			return spy;
		},
		callThrough: () => spy,
	};
	spy.calls = { reset: () => spy.mockReset() };
	return spy;
};

