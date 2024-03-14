import { Client } from "@elastic/elasticsearch";
import { SearchResponse } from "@elastic/elasticsearch/lib/api/types";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { z } from "zod";

export type CompanyData = {
  domain: string;
  company_commercial_name: string;
  company_legal_name: string;
  company_all_available_names: string[];
  phone_numbers: string[];
  social_media_links: string[];
  address: string;
};

const phoneNumberTransformer = z.string().transform((val) => {
  const phoneNumber = parsePhoneNumberFromString(val, "US"); // Default to 'US' or choose based on your needs
  if (!phoneNumber) return val; // Return original value if parsing fails
  return phoneNumber.formatInternational(); // Or .formatE164() for E.164 format
});

export const SearchCriteriaSchema = z.object({
  name: z.string().optional(),
  website: z.string().optional(),
  phoneNumber: phoneNumberTransformer.optional(),
  facebookProfile: z.string().optional(),
});

export type CompanySearchCriteria = z.infer<typeof SearchCriteriaSchema>;

interface IStorageCompanyClient {
  upsertCompanyData(data: CompanyData[]): Promise<void>;
  searchCompanyProfile(criteria: CompanySearchCriteria): Promise<any[]>;
}

export class ESCompanyClient implements IStorageCompanyClient {
  private client: Client;
  private indexName: string;

  constructor(indexName: string) {
    this.client = new Client({ node: "http://localhost:9200" });
    this.indexName = indexName;
  }

  public async upsertCompanyData(data: CompanyData[]): Promise<void> {
    const body = data.flatMap((doc) => [
      { update: { _index: this.indexName, _id: doc.domain } },
      { doc, doc_as_upsert: true },
    ]);
    await this.client.bulk({ refresh: true, body });
  }

  public async searchCompanyProfile(
    criteria: CompanySearchCriteria
  ): Promise<any[]> {
    const searchConditions: any[] = [];

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

    const response = await this.client.search({
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

    console.log(
      "Elasticsearch query:",
      JSON.stringify(
        {
          index: this.indexName,
          body: {
            query: {
              bool: {
                should: searchConditions,
                minimum_should_match: 1,
              },
            },
          },
        },
        null,
        2
      )
    );

    console.log("Elasticsearch response:", JSON.stringify(response, null, 2));

    const hits = response.hits?.hits ?? [];
    return hits.map((hit) => hit._source);
  }
}
