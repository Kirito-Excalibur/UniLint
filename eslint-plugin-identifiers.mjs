export default {
  rules: {
    "collect-identifiers": {
      meta: { type: "suggestion", schema: [] },
      create(context) {
        const seen = new Set();
        return {
          Identifier(node) {
            seen.add(node.name);
          },
          "Program:exit"() {
            console.log(JSON.stringify({
              file: context.getFilename(),
              identifiers: [...seen]
            }));
          }
        };
      }
    }
  }
};
