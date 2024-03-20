import axios from "axios";
import cheerio from "cheerio";

export interface IScraperService {
  extractCompanyInformationFromWebsite(url: string): Promise<ScrapedData>;
}

export type ScrapedData = {
  phoneNumbers: string[];
  socialMediaLinks: string[];
  address?: string;
};

export class ScraperService implements IScraperService {
  public async extractCompanyInformationFromWebsite(
    url: string
  ): Promise<ScrapedData> {
    try {
      let $ = await this.loadPage(url);

      const contactPageUrl = this.findContactPageUrl($, url);
      if (contactPageUrl) {
        $ = await this.loadPage(contactPageUrl);
      }

      return {
        phoneNumbers: this.extractPhoneNumbers($),
        socialMediaLinks: this.extractSocialMediaLinks($),
        address: this.extractAddress($),
      };
    } catch (error) {
      // console.error(`Error scraping ${url}: `);
      return { phoneNumbers: [], socialMediaLinks: [], address: undefined };
    }
  }

  private async loadPage(url: string): Promise<cheerio.Root> {
    const response = await axios.get(url, {
      headers: { "Accept-Encoding": "gzip, deflate" },
    });
    return cheerio.load(response.data);
  }

  private findContactPageUrl($: cheerio.Root, baseURL: string): string | null {
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

  private extractPhoneNumbers($: cheerio.Root): string[] {
    const phoneRegex =
      /(\+?\d{1,4}[\s\-]?)?(\(?\d{3}\)?[\s\-]?)?[\d\s\-]{7,10}\d/g;
    let phoneNumbers: string[] = [];
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

  private extractSocialMediaLinks($: cheerio.Root): string[] {
    const socialMediaDomains = [
      "facebook.com",
      "twitter.com",
      "linkedin.com",
      "instagram.com",
    ];
    const links = new Set<string>();
    $("a[href]").each((_, elem) => {
      const href = $(elem).attr("href");
      if (href && socialMediaDomains.some((domain) => href.includes(domain))) {
        links.add(href);
      }
    });
    return Array.from(links);
  }

  private extractAddress($: cheerio.Root): string | undefined {
    let address: string | undefined;
    const possibleSelectors = [
      "p",
      ".address",
      '[itemtype="http://schema.org/PostalAddress"]',
    ];
    possibleSelectors.some((selector) => {
      $(selector).each((_, elem) => {
        const text = $(elem).text();
        const addressRegex =
          /(?:\w+\s*\w+)?\s+([\w\d\s]+)\s*#?([\w\d]+)(?:,\s*[\w\s]+(?:,\s*(?:Second Floor|Suite\s*\d+|\s*Floor\s*\d+)?)?)?\s*,\s*[A-Z]{2}\s\d{5}/i;
        if (addressRegex.test(text)) {
          address = text;
          return true;
        }
      });
      if (address) return true;
      return false;
    });
    return address;
  }
}
