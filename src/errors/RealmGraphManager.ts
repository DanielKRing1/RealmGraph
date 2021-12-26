export const genInitError = (callingMethodName: string) => new Error(`${callingMethodName} cannot be called before calling init()`);
