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
exports.ESCompanyClient = exports.SearchCriteriaSchema = void 0;
const elasticsearch_1 = require("@elastic/elasticsearch");
const libphonenumber_js_1 = require("libphonenumber-js");
const zod_1 = require("zod");
const phoneNumberTransformer = zod_1.z.string().transform((val) => {
    const phoneNumber = (0, libphonenumber_js_1.parsePhoneNumberFromString)(val, "US"); // Default to 'US' or choose based on your needs
    if (!phoneNumber)
        return val; // Return original value if parsing fails
    return phoneNumber.formatInternational(); // Or .formatE164() for E.164 format
});
exports.SearchCriteriaSchema = zod_1.z.object({
    name: zod_1.z.string().optional(),
    website: zod_1.z.string().optional(),
    phoneNumber: phoneNumberTransformer.optional(),
    facebookProfile: zod_1.z.string().optional(),
});
class ESCompanyClient {
    constructor(indexName) {
        this.client = new elasticsearch_1.Client({ node: "http://localhost:9200" });
        this.indexName = indexName;
    }
    upsertCompanyData(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const body = data.flatMap((doc) => [
                { update: { _index: this.indexName, _id: doc.domain } },
                { doc, doc_as_upsert: true },
            ]);
            yield this.client.bulk({ refresh: true, body });
        });
    }
    searchCompanyProfile(criteria) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const searchConditions = [];
            if (criteria.name) {
                // Fuzzy matching on names, considering potential variations
                searchConditions.push({
                    multi_match: {
                        query: criteria.name,
                        fields: [
                            "company_commercial_name",
                            "company_legal_name",
                            "company_all_available_names",
                        ],
                        fuzziness: "AUTO",
                    },
                });
            }
            if (criteria.website) {
                // Exact match or close variation for websites
                searchConditions.push({
                    match: {
                        domain: criteria.website,
                    },
                });
            }
            if (criteria.phoneNumber) {
                // Phone numbers can be exact or use a pattern match if formatting varies
                searchConditions.push({
                    match: {
                        phone_numbers: criteria.phoneNumber,
                    },
                });
            }
            if (criteria.facebookProfile) {
                // Assuming social media links are stored in a specific format
                searchConditions.push({
                    match_phrase: {
                        social_media_links: criteria.facebookProfile,
                    },
                });
            }
            const response = yield this.client.search({
                index: this.indexName,
                body: {
                    query: {
                        bool: {
                            should: searchConditions,
                            minimum_should_match: 1, // Adjust based on how strict you want the matching to be
                        },
                    },
                },
            });
            console.log("Elasticsearch query:", JSON.stringify({
                index: this.indexName,
                body: {
                    query: {
                        bool: {
                            should: searchConditions,
                            minimum_should_match: 1,
                        },
                    },
                },
            }, null, 2));
            console.log("Elasticsearch response:", JSON.stringify(response, null, 2));
            const hits = (_b = (_a = response.hits) === null || _a === void 0 ? void 0 : _a.hits) !== null && _b !== void 0 ? _b : [];
            return hits.map((hit) => hit._source);
        });
    }
}
exports.ESCompanyClient = ESCompanyClient;
