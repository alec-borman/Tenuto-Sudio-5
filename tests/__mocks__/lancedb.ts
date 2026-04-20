export const connect = async () => {
  return {
    openTable: async () => ({
      search: () => ({
        limit: () => ({
          execute: async () => [{ text: 'mock tenuto documentation' }]
        })
      })
    })
  };
};
