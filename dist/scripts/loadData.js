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
const storageClient_1 = require("../storageClient");
const csv_1 = require("../utils/csv");
const indexName = "company-data"; // The name of your Elasticsearch index
const csvFilePath = "./data/merged-data.csv"; // The path to your merged CSV file
const esClient = new storageClient_1.ESCompanyClient(indexName);
const bulkUpsertToElasticsearch = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Read data from CSV
        const csvData = yield (0, csv_1.readFromCSV)(csvFilePath);
        // Map and adjust data as necessary
        const dataToUpsert = csvData.map((item) => (Object.assign(Object.assign({}, item), { 
            // Ensure that fields expected to be arrays are correctly formatted
            company_all_available_names: parseArrayField(item.company_all_available_names), phone_numbers: parseArrayField(item.phone_numbers), social_media_links: parseArrayField(item.social_media_links) })));
        // Perform bulk upsert
        yield esClient.upsertCompanyData(dataToUpsert);
        console.log("Data successfully upserted to Elasticsearch");
    }
    catch (error) {
        console.error("Error upserting data to Elasticsearch:", error);
    }
});
// Utility function to parse stringified arrays from CSV
const parseArrayField = (field) => {
    if (Array.isArray(field))
        return field; // Already in the correct format
    try {
        return JSON.parse(field);
    }
    catch (_a) {
        return field ? [field] : [];
    }
};
bulkUpsertToElasticsearch();
