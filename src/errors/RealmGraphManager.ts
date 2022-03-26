export const genInitError = (callingMethodName: string) => new Error(`${callingMethodName} cannot be called before calling init()`);
export const genNoGraphError = (graphName: string, callingMethodName: string) => new Error(`No graph "${graphName} exists; Called by "${callingMethodName}"`);
