// scraperWorker.ts
import { parentPort } from "worker_threads";
import { ScraperService, ScrapedData } from "../scraperService";

if (parentPort) {
  parentPort.on("message", async (domain: string) => {
    const scraperService = new ScraperService();
    try {
      const data: ScrapedData =
        await scraperService.extractCompanyInformationFromWebsite(
          `http://${domain}`
        );
      parentPort!.postMessage({ domain, data });
    } catch (error: any) {
      parentPort!.postMessage({ domain, error: error.message });
    }
  });
}
