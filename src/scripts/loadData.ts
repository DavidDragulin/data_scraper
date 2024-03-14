import { ESCompanyClient, CompanyData } from "../storageClient";
import { readFromCSV } from "../utils/csv";

const indexName = "company-data"; // The name of your Elasticsearch index
const csvFilePath = "./data/merged-data.csv"; // The path to your merged CSV file

const esClient = new ESCompanyClient(indexName);

const bulkUpsertToElasticsearch = async () => {
  try {
    // Read data from CSV
    const csvData: CompanyData[] = await readFromCSV(csvFilePath);

    // Map and adjust data as necessary
    const dataToUpsert = csvData.map((item) => ({
      ...item,
      // Ensure that fields expected to be arrays are correctly formatted
      company_all_available_names: parseArrayField(
        item.company_all_available_names
      ),
      phone_numbers: parseArrayField(item.phone_numbers),
      social_media_links: parseArrayField(item.social_media_links),
    }));

    // Perform bulk upsert
    await esClient.upsertCompanyData(dataToUpsert);

    console.log("Data successfully upserted to Elasticsearch");
  } catch (error) {
    console.error("Error upserting data to Elasticsearch:", error);
  }
};

// Utility function to parse stringified arrays from CSV
const parseArrayField = (field: string | string[]): string[] => {
  if (Array.isArray(field)) return field; // Already in the correct format
  try {
    return JSON.parse(field);
  } catch {
    return field ? [field] : [];
  }
};

bulkUpsertToElasticsearch();
