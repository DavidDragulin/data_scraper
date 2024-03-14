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
exports.searchController = void 0;
const zod_1 = require("zod");
const storageClient_1 = require("./storageClient");
const esClient = new storageClient_1.ESCompanyClient("company-data");
const searchController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Validate request body against schema
        const criteria = storageClient_1.SearchCriteriaSchema.parse(req.body);
        // If the validation passes, proceed with the search
        // Transform the validated data into the format expected by your search method, if necessary
        const searchResults = yield esClient.searchCompanyProfile(criteria);
        // Respond with the search results
        res.json({ status: "success", data: searchResults });
    }
    catch (error) {
        // Handle validation errors
        if (error instanceof zod_1.z.ZodError) {
            // Return a bad request response with error details
            return res.status(400).json({
                status: "error",
                errors: error.errors.map((e) => ({
                    path: e.path.join("."),
                    message: e.message,
                })),
            });
        }
        // Handle other errors (e.g., search errors)
        console.error("Error during search:", error);
        res.status(500).json({ status: "error", message: "Internal server error" });
    }
});
exports.searchController = searchController;
