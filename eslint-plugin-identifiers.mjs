import { features } from "web-features";

export default {
  rules: {
    "collect-identifiers": {
      meta: {
        type: "suggestion",
        schema: [
          {
            enum:["low","high","false"]
          }
        ],
        messages: {
          "high": "'{{name}}' is baseline widely available",
          "low": "'{{name}}' is baseline newly available",
          "false": "'{{name}}' is baseline limited",
        }
      },
      create(context) {

        const options=context.options[0] || "high";
        // const val=options.enum||"high";

        // console.log(options)

        const seen = new Set();
        return {
          Identifier(node) {
            seen.add(node.name);

            // console.log(node.name);

            if (features?.[node.name]!==undefined) {
                if (features[node.name].status.baseline === options) {
                  context.report({
                    node,
                    messageId: "high",
                    data: { name: node.name}
                  });
                }
              }
            },

         
          "Program:exit"() {
            // seen.forEach(name => {

            //   if (features?.[name] !== undefined) {

            //     if (features[name].status.baseline === "high") {
            //       context.report({
            //         node,
            //         messageId: "high",
            //         data: { name: features[name].status.baseline }
            //       });

            //     }

            //   }
            // });
            // console.log(JSON.stringify({
            //   file: context.getFilename(),
            //   identifiers: [...seen]
            // }));
          }
        };
        // console.log("Plugin loaded");
        // return {

        //   Identifier(node) {

        //     if(node.name === "a") {
        //       context.report({
        //         node,
        //         messageId: "unexpected-identifier",
        //         data: { name: node.name }
        //       });
        //     }

        //   },

        //   // "Program:exit"() {
        //   //   console.log(context);
        //   // }
        // };

      }
    }
  }
};
