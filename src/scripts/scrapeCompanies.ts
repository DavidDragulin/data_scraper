import { Worker } from "worker_threads";
import { readFromCSV, writeToCSV } from "../utils/csv";
import path from "path";
import { ScrapedData } from "../scraperService";

type DomainData = {
  domain: string;
};

type WorkerData = {
  domain: string;
  data?: ScrapedData;
  error?: string;
};

const startScraping = async () => {
  const startTime = Date.now();
  const inputFilePath = "./data/sample-websites.csv";
  const outputFilePath = "./data/scraped-data.csv";

  try {
    const domains: DomainData[] = await readFromCSV(inputFilePath);
    const scrapedData: WorkerData[] = [];

    const promises = domains.map(
      ({ domain }) =>
        new Promise<WorkerData>((resolve) => {
          const worker = new Worker("./dist/scripts/scraperWorker.js");
          worker.on("message", (msg: WorkerData) => resolve(msg));
          worker.on("error", (err) => resolve({ domain, error: err.message }));
          worker.on("exit", (code) => {
            if (code !== 0) {
              console.error(`Worker stopped with exit code ${code}`);
              resolve({
                domain,
                error: `Worker stopped with exit code ${code}`,
              });
            }
          });
          worker.postMessage(domain);
        })
    );

    const results = await Promise.all(promises);
    results.forEach((result) => {
      if (!result.error) {
        scrapedData.push(result);
      } else {
        console.error(`Error with domain ${result.domain}: ${result.error}`);
      }
    });

    // Once all data is scraped, write it to a CSV file
    await writeToCSV(scrapedData, outputFilePath);
    console.log(`Data written to ${outputFilePath}`);
  } catch (error) {
    console.error("Error during scraping:", error);
  } finally {
    const endTime = Date.now();
    console.log(`Time taken: ${endTime - startTime}ms`);
  }
};

startScraping();
