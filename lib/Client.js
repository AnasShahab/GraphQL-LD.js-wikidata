"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = void 0;
const graphql_to_sparql_1 = require("graphql-to-sparql");
const jsonld_context_parser_1 = require("jsonld-context-parser");
const sparqljson_to_tree_1 = require("sparqljson-to-tree");
/**
 * A GraphQL-LD client.
 *
 * Typical usage:
 * ```
 * const client = new Client({ context, queryEngine });
 * const { data } = await client.query({ query: `{ books { name author { name } } }` });
 * ```
 */
class Client {
    constructor(args) {
        this.context = (args.contextParser || new jsonld_context_parser_1.ContextParser()).parse(args.context, { baseIRI: args.baseIRI });
        this.queryEngine = args.queryEngine;
        this.graphqlToSparqlConverter = args.graphqlToSparqlConverter ||
            new graphql_to_sparql_1.Converter({ dataFactory: args.dataFactory, requireContext: true });
        this.sparqlJsonToTreeConverter = args.sparqlJsonToTreeConverter ||
            new sparqljson_to_tree_1.Converter({ dataFactory: args.dataFactory, materializeRdfJsTerms: true });
    }
    /**
     * Execute a GraphQL-LD query.
     *
     * There are three ways of invoking this methods:
     * 1. with a GraphQL query string and optional variables:
     *    `client.query({ query: `{...}`, variables: { varName: 123 } })`
     * 2. with a parsed GraphQL query and optional variables:
     *    `client.query({ query: gql`{...}`, variables: { varName: 123 } })`
     * 3. with a SPARQL algebra object and a singularizeVariables object
     *    `client.query({ sparqlAlgebra, singularizeVariables })`
     *    This corresponds to the result of {@link Client#graphQlToSparql}.
     *
     * @param {QueryArgs} args Query+variables, or SPARQL algebra+singularize variables.
     * @return {Promise<ExecutionResult>} A promise resolving to a GraphQL result.
     */
    query(args) {
        return __awaiter(this, void 0, void 0, function* () {
            // Convert GraphQL to SPARQL
            const { sparqlAlgebra, singularizeVariables } = 'query' in args
                ? yield this.graphQlToSparql({ query: args.query, variables: args.variables }) : args;
            // Execute SPARQL query
            const sparqlJsonResult = yield this.queryEngine.query(sparqlAlgebra, args.queryEngineOptions);
            // Convert SPARQL response to GraphQL response
            const data = this.sparqlJsonToTreeConverter.sparqlJsonResultsToTree(sparqlJsonResult, { singularizeVariables });
            return { data };
        });
    }
    /**
     * Convert a GraphQL query to SPARQL algebra and a singularize variables object.
     * @param {string | DocumentNode} query
     * @param {{[p: string]: any}} variables
     * @return {Promise<IGraphQlToSparqlResult>}
     */
    graphQlToSparql({ query, variables }) {
        return __awaiter(this, void 0, void 0, function* () {
            const singularizeVariables = {};
            const options = {
                singularizeVariables,
                variablesDict: {},
            };
            const sparqlAlgebra = yield this.graphqlToSparqlConverter
                .graphqlToSparqlAlgebra(query, (yield this.context).getContextRaw(), options);
            return { sparqlAlgebra, singularizeVariables };
        });
    }
}
exports.Client = Client;
//# sourceMappingURL=Client.js.map