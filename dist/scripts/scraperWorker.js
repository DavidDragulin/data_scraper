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
// scraperWorker.ts
const worker_threads_1 = require("worker_threads");
const scraperService_1 = require("../scraperService");
if (worker_threads_1.parentPort) {
    worker_threads_1.parentPort.on("message", (domain) => __awaiter(void 0, void 0, void 0, function* () {
        const scraperService = new scraperService_1.ScraperService();
        try {
            const data = yield scraperService.extractCompanyInformationFromWebsite(`http://${domain}`);
            worker_threads_1.parentPort.postMessage({ domain, data });
        }
        catch (error) {
            worker_threads_1.parentPort.postMessage({ domain, error: error.message });
        }
    }));
}
