import { Parser } from "json2csv";
import { readFromCSV } from "../utils/csv";
import fs from "fs";
import path from "path";

// Main function to merge data from two CSV files
const mergeCsvFiles = async (
  file1Path: string,
  file2Path: string,
  outputPath: string
) => {
  try {
    const file1Data = await readFromCSV(file1Path); // Read first file
    const file2Data = await readFromCSV(file2Path); // Read second file
    const mergedData: any[] = [];

    file1Data.forEach((row1) => {
      const row2 = file2Data.find((row) => row.domain === row1.domain);
      if (row2) {
        // Merge data based on domain
        mergedData.push({
          domain: row1.domain,
          company_commercial_name: row1.company_commercial_name,
          company_legal_name: row1.company_legal_name,
          company_all_available_names: row1.company_all_available_names,
          phone_numbers: row2.phoneNumbers,
          social_media_links: row2.socialMediaLinks,
          address: row2.address,
        });
      }
    });

    // Write merged data to output CSV
    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(mergedData);
    fs.writeFileSync(outputPath, csv);
    console.log(`Merged data written to ${outputPath}`);
  } catch (error) {
    console.error("Error merging CSV files:", error);
  }
};

// Paths to your CSV files and output file
const file1Path = "./data/sample-websites-company-names.csv";
const file2Path = "./data/scraped-data.csv";
const outputPath = "./data/merged-data.csv";

// Execute the merge function
mergeCsvFiles(file1Path, file2Path, outputPath);
