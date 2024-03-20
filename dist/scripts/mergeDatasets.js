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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const json2csv_1 = require("json2csv");
const csv_1 = require("../utils/csv");
const fs_1 = __importDefault(require("fs"));
// Main function to merge data from two CSV files
const mergeCsvFiles = (file1Path, file2Path, outputPath) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const file1Data = yield (0, csv_1.readFromCSV)(file1Path); // Read the first file (company names)
        const file2Data = yield (0, csv_1.readFromCSV)(file2Path); // Read the second file (scraped data)
        const mergedData = [];
        // Iterate through the first file to preserve all company name information
        file1Data.forEach((row1) => {
            const row2 = file2Data.find((row) => row.domain === row1.domain);
            if (row2) {
                const dataField = JSON.parse(row2.data); // Parse the JSON string to extract fields
                // Merge data based on domain, including the address now
                mergedData.push({
                    domain: row1.domain,
                    company_commercial_name: row1.company_commercial_name,
                    company_legal_name: row1.company_legal_name,
                    company_all_available_names: row1.company_all_available_names,
                    phone_numbers: dataField.phoneNumbers || [], // Extracted from the parsed JSON
                    social_media_links: dataField.socialMediaLinks || [], // Extracted from the parsed JSON
                    address: dataField.address || "", // Extract the address, providing a fallback
                });
            }
        });
        // Write merged data to output CSV
        const json2csvParser = new json2csv_1.Parser();
        const csv = json2csvParser.parse(mergedData);
        fs_1.default.writeFileSync(outputPath, csv);
        console.log(`Merged data written to ${outputPath}`);
    }
    catch (error) {
        console.error("Error merging CSV files:", error);
    }
});
// Paths to your CSV files and output file
const file1Path = "./data/sample-websites-company-names.csv";
const file2Path = "./data/scraped-data.csv";
const outputPath = "./data/merged-data.csv";
// Execute the merge function
mergeCsvFiles(file1Path, file2Path, outputPath);
