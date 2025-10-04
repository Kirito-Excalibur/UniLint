import { features } from "web-features";

export default {
  rules: {
    "collect-identifiers": {
      meta: {
        type: "suggestion",
        schema: [
          {
            enum: ["low", "high", "false"]
          }
        ],
        messages: {
          "high": "'{{name}}' is baseline widely available",
          "low": "'{{name}}' is baseline newly available",
          "false": "'{{name}}' is baseline limited",
        }
      },
      create(context) {

        const options = context.options[0] || "high";
        // const val=options.enum||"high";

        // console.log(options)

        // const seen = new Set();


        return {



          Identifier(node) {
            // seen.add(node.name);

            // console.log(node.name);


            if (features?.[node.name]!==undefined && features[node.name].status?.baseline) {
                if (features[node.name].status.baseline === options) {
            context.report({
              loc: node.loc,
              messageId: options,
              data: { name: node.name }
            });
              }
            }
          },


          "Program:exit"() {

          }
        };

      }
    }
  }
};
