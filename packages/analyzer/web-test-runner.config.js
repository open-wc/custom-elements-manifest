export default {
  plugins: [
    {
      resolveMimeType(ctx) {
        if (ctx.originalUrl.includes('?serve-as-text')) { 
          return '.txt';
        }
      }
    }
  ] 
}