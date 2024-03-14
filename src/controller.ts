import { Request, Response } from "express";
import { z } from "zod";
import { ESCompanyClient, SearchCriteriaSchema } from "./storageClient";

const esClient = new ESCompanyClient("company-data");
export const searchController = async (req: Request, res: Response) => {
  try {
    // Validate request body against schema
    const criteria = SearchCriteriaSchema.parse(req.body);

    // If the validation passes, proceed with the search
    // Transform the validated data into the format expected by your search method, if necessary
    const searchResults = await esClient.searchCompanyProfile(criteria);

    // Respond with the search results
    res.json({ status: "success", data: searchResults });
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
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
};
