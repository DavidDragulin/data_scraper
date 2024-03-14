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
const worker_threads_1 = require("worker_threads");
const csv_1 = require("../utils/csv");
const startScraping = () => __awaiter(void 0, void 0, void 0, function* () {
    const startTime = Date.now();
    const inputFilePath = "./data/sample-websites.csv";
    const outputFilePath = "./data/scraped-data.csv";
    try {
        const domains = yield (0, csv_1.readFromCSV)(inputFilePath);
        const scrapedData = [];
        const promises = domains.map(({ domain }) => new Promise((resolve) => {
            const worker = new worker_threads_1.Worker("./dist/scripts/scraperWorker.js");
            worker.on("message", (msg) => resolve(msg));
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
        }));
        const results = yield Promise.all(promises);
        results.forEach((result) => {
            if (!result.error) {
                scrapedData.push(result);
            }
            else {
                console.error(`Error with domain ${result.domain}: ${result.error}`);
            }
        });
        // Once all data is scraped, write it to a CSV file
        yield (0, csv_1.writeToCSV)(scrapedData, outputFilePath);
        console.log(`Data written to ${outputFilePath}`);
    }
    catch (error) {
        console.error("Error during scraping:", error);
    }
    finally {
        const endTime = Date.now();
        console.log(`Time taken: ${endTime - startTime}ms`);
    }
});
startScraping();
