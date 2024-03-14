import express, { Request, Response } from "express";
import { ESCompanyClient } from "./storageClient";

const app = express();
const esClient = new ESCompanyClient("company-data"); // Replace with your actual index name

app.use(express.json());

// Define a route for searching company profiles
app.post("/search", async (req: Request, res: Response) => {
  try {
    const searchCriteria = req.body;
    const results = await esClient.searchCompanyProfile(searchCriteria);
    res.json(results);
  } catch (error) {
    console.error("Error searching company profiles:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default app;
