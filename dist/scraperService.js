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
exports.ScraperService = void 0;
const axios_1 = __importDefault(require("axios"));
const cheerio_1 = __importDefault(require("cheerio"));
class ScraperService {
    extractCompanyInformationFromWebsite(url) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let $ = yield this.loadPage(url);
                const contactPageUrl = this.findContactPageUrl($, url);
                if (contactPageUrl) {
                    $ = yield this.loadPage(contactPageUrl);
                }
                return {
                    phoneNumbers: this.extractPhoneNumbers($),
                    socialMediaLinks: this.extractSocialMediaLinks($),
                    address: this.extractAddress($),
                };
            }
            catch (error) {
                // console.error(`Error scraping ${url}: `);
                return { phoneNumbers: [], socialMediaLinks: [], address: undefined };
            }
        });
    }
    loadPage(url) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield axios_1.default.get(url, {
                headers: { "Accept-Encoding": "gzip, deflate" },
            });
            return cheerio_1.default.load(response.data);
        });
    }
    findContactPageUrl($, baseURL) {
        let contactPageHref = null;
        $("a:contains('Contact'), a:contains('contact')").each((_, elem) => {
            const href = $(elem).attr("href");
            if (href) {
                contactPageHref = href.startsWith("http")
                    ? href
                    : new URL(href, baseURL).href;
                return false; // Break loop
            }
        });
        return contactPageHref;
    }
    extractPhoneNumbers($) {
        const phoneRegex = /(\+?\d{1,4}[\s\-]?)?(\(?\d{3}\)?[\s\-]?)?[\d\s\-]{7,10}\d/g;
        let phoneNumbers = [];
        $("body")
            .find('a[href^="tel:"], p, .contact')
            .each((_, element) => {
            const text = $(element).text();
            let match;
            while ((match = phoneRegex.exec(text)) !== null) {
                phoneNumbers.push(match[0].trim());
            }
        });
        return [...new Set(phoneNumbers)].filter((number) => number.length >= 7);
    }
    extractSocialMediaLinks($) {
        const socialMediaDomains = [
            "facebook.com",
            "twitter.com",
            "linkedin.com",
            "instagram.com",
        ];
        const links = new Set();
        $("a[href]").each((_, elem) => {
            const href = $(elem).attr("href");
            if (href && socialMediaDomains.some((domain) => href.includes(domain))) {
                links.add(href);
            }
        });
        return Array.from(links);
    }
    extractAddress($) {
        let address;
        const possibleSelectors = [
            "p",
            ".address",
            '[itemtype="http://schema.org/PostalAddress"]',
        ];
        possibleSelectors.some((selector) => {
            $(selector).each((_, elem) => {
                const text = $(elem).text();
                const addressRegex = /(?:\w+\s*\w+)?\s+([\w\d\s]+)\s*#?([\w\d]+)(?:,\s*[\w\s]+(?:,\s*(?:Second Floor|Suite\s*\d+|\s*Floor\s*\d+)?)?)?\s*,\s*[A-Z]{2}\s\d{5}/i;
                if (addressRegex.test(text)) {
                    address = text;
                    return true;
                }
            });
            if (address)
                return true;
            return false;
        });
        return address;
    }
}
exports.ScraperService = ScraperService;
