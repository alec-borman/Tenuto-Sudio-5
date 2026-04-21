// Browser-safe stub overriding native OS binaries for WebAssembly compatibility matrices
export const connect = async () => {
  return {
    openTable: async () => ({
      search: () => ({
        limit: () => ({
          execute: async () => [{ text: 'mock tenuto documentation (browser stub)' }]
        })
      })
    })
  };
};
