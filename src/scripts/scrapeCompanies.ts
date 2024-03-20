import { Worker } from "worker_threads";
import { readFromCSV, writeToCSV } from "../utils/csv";
import async from "async";
import { ScrapedData } from "../scraperService";

type DomainData = {
  domain: string;
};

type WorkerData = {
  domain: string;
  data?: ScrapedData;
  error?: string;
};

let totalSites = 0;
let successfulCrawls = 0;
let phoneNumbersExtracted = 0;
let socialMediaLinksExtracted = 0;
let addressesExtracted = 0;
let unsuccessfulCrawls = 0;

const startScraping = async () => {
  const startTime = Date.now();
  const inputFilePath = "./data/sample-websites.csv";
  const outputFilePath = "./data/scraped-data.csv";

  try {
    const domains: DomainData[] = await readFromCSV(inputFilePath);
    totalSites = domains.length;
    const scrapedData: WorkerData[] = [];

    // Set up the queue with a concurrency limit
    const workerQueue = async.queue(async (domain: DomainData, callback) => {
      const worker = new Worker("./dist/scripts/scraperWorker.js");
      worker.on("message", (msg: WorkerData) => {
        if (!msg.error) {
          successfulCrawls++;
          if ((msg.data?.phoneNumbers?.length ?? 0) > 0)
            phoneNumbersExtracted++;
          if ((msg.data?.socialMediaLinks?.length ?? 0) > 0)
            socialMediaLinksExtracted++;
          if (msg.data?.address) addressesExtracted++;
          scrapedData.push(msg);
        } else {
          console.error(`Error with domain ${msg.domain}: ${msg.error}`);
        }
        worker.terminate(); // Terminate the worker after handling its message
        callback();
      });
      worker.on("error", (err) => {
        console.error(
          `Worker error for domain ${domain.domain}: ${err.message}`
        );
        worker.terminate(); // Ensure termination upon error
        callback(err);
      });
      worker.postMessage(domain.domain);
    }, 10); // Limit of 10 workers at a time

    // Add domains to the queue
    domains.forEach((domain) => workerQueue.push(domain));

    // Await completion of all tasks in the queue
    workerQueue.drain(() => {
      console.log("Finished scraping. Writing data to CSV...");
      writeToCSV(scrapedData, outputFilePath).then(() => {
        console.log(`Data written to ${outputFilePath}`);

        // Calculate and log statistics
        const endTime = Date.now();
        console.log(`Time taken: ${endTime - startTime}ms`);

        const coverage = successfulCrawls / totalSites;
        const phoneNumberFillRate = phoneNumbersExtracted / successfulCrawls;
        const socialMediaLinkFillRate =
          socialMediaLinksExtracted / successfulCrawls;
        const addressFillRate = addressesExtracted / successfulCrawls;

        console.log(`Coverage: ${coverage}`);
        console.log(`Phone Number Fill Rate: ${phoneNumberFillRate}`);
        console.log(`Social Media Link Fill Rate: ${socialMediaLinkFillRate}`);
        console.log(`Address Fill Rate: ${addressFillRate}`);

        // Force the script to exit, if it doesn't automatically
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("Error during scraping:", error);
  }
};

startScraping();
