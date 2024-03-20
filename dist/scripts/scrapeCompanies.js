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
const worker_threads_1 = require("worker_threads");
const csv_1 = require("../utils/csv");
const async_1 = __importDefault(require("async"));
let totalSites = 0;
let successfulCrawls = 0;
let phoneNumbersExtracted = 0;
let socialMediaLinksExtracted = 0;
let addressesExtracted = 0;
const startScraping = () => __awaiter(void 0, void 0, void 0, function* () {
    const startTime = Date.now();
    const inputFilePath = "./data/sample-websites.csv";
    const outputFilePath = "./data/scraped-data.csv";
    try {
        const domains = yield (0, csv_1.readFromCSV)(inputFilePath);
        totalSites = domains.length;
        const scrapedData = [];
        // Set up the queue with a concurrency limit
        const workerQueue = async_1.default.queue((domain, callback) => __awaiter(void 0, void 0, void 0, function* () {
            const worker = new worker_threads_1.Worker("./dist/scripts/scraperWorker.js");
            worker.on("message", (msg) => {
                var _a, _b, _c, _d, _e, _f, _g;
                if (!msg.error) {
                    successfulCrawls++;
                    if (((_c = (_b = (_a = msg.data) === null || _a === void 0 ? void 0 : _a.phoneNumbers) === null || _b === void 0 ? void 0 : _b.length) !== null && _c !== void 0 ? _c : 0) > 0)
                        phoneNumbersExtracted++;
                    if (((_f = (_e = (_d = msg.data) === null || _d === void 0 ? void 0 : _d.socialMediaLinks) === null || _e === void 0 ? void 0 : _e.length) !== null && _f !== void 0 ? _f : 0) > 0)
                        socialMediaLinksExtracted++;
                    if ((_g = msg.data) === null || _g === void 0 ? void 0 : _g.address)
                        addressesExtracted++;
                    scrapedData.push(msg);
                }
                else {
                    console.error(`Error with domain ${msg.domain}: ${msg.error}`);
                }
                worker.terminate(); // Terminate the worker after handling its message
                callback();
            });
            worker.on("error", (err) => {
                console.error(`Worker error for domain ${domain.domain}: ${err.message}`);
                worker.terminate(); // Ensure termination upon error
                callback(err);
            });
            worker.postMessage(domain.domain);
        }), 10); // Limit of 10 workers at a time
        // Add domains to the queue
        domains.forEach((domain) => workerQueue.push(domain));
        // Await completion of all tasks in the queue
        workerQueue.drain(() => {
            console.log("Finished scraping. Writing data to CSV...");
            (0, csv_1.writeToCSV)(scrapedData, outputFilePath).then(() => {
                console.log(`Data written to ${outputFilePath}`);
                // Calculate and log statistics
                const endTime = Date.now();
                console.log(`Time taken: ${endTime - startTime}ms`);
                const coverage = successfulCrawls / totalSites;
                const phoneNumberFillRate = phoneNumbersExtracted / successfulCrawls;
                const socialMediaLinkFillRate = socialMediaLinksExtracted / successfulCrawls;
                const addressFillRate = addressesExtracted / successfulCrawls;
                console.log(`Coverage: ${coverage}`);
                console.log(`Phone Number Fill Rate: ${phoneNumberFillRate}`);
                console.log(`Social Media Link Fill Rate: ${socialMediaLinkFillRate}`);
                console.log(`Address Fill Rate: ${addressFillRate}`);
                // Force the script to exit, if it doesn't automatically
                process.exit(0);
            });
        });
    }
    catch (error) {
        console.error("Error during scraping:", error);
    }
});
startScraping();
