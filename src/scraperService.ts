import axios from "axios";
import cheerio from "cheerio";

// Can be placed in a different file if the project gets large but for simplicity I have placed it here.
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
      // Initial page scrape
      let $ = await this.loadPage(url);

      // Attempt to find and navigate to a more specific page like 'Contact Us'
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
      console.error(`Error scraping ${url}: `);
      return {
        phoneNumbers: [],
        socialMediaLinks: [],
        address: undefined,
      };
    }
  }

  private async loadPage(url: string): Promise<cheerio.Root> {
    const response = await axios.get(url);
    return cheerio.load(response.data);
  }

  private findContactPageUrl($: cheerio.Root, baseURL: string): string | null {
    let contactPageHref = null;
    $("a").each((_, elem) => {
      const text = $(elem).text().toLowerCase();
      const href = $(elem).attr("href");
      if (text.includes("contact") && href) {
        contactPageHref = href.startsWith("http")
          ? href
          : new URL(href, baseURL).href;
        return false; // Break loop
      }
    });

    return contactPageHref;
  }

  private extractPhoneNumbers($: cheerio.Root): string[] {
    let phoneNumbers: string[] = [];

    // Regex to match a variety of phone number formats
    const phoneRegex =
      /(\+?\d{1,4}[\s\-]?)?(\(?\d{3}\)?[\s\-]?)?[\d\s\-]{7,10}\d/g;

    $("*").each((_, element) => {
      // TypeScript-safe way to check and access attributes
      if (element.type === "tag" && element.attribs) {
        const attributesContainPhone = Object.entries(element.attribs).some(
          ([attrName, attrValue]) =>
            attrName.includes("phone") || attrValue.includes("phone")
        );

        if (attributesContainPhone) {
          const text = $(element).text();
          let match;
          while ((match = phoneRegex.exec(text)) !== null) {
            phoneNumbers.push(match[0].trim());
          }
        }
      }
    });

    // Deduplicate
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
    // Initialize a variable to hold the address
    let address: string | undefined;

    // Look for specific identifiers like class names or ids that might be used on a contact page
    // The provided screenshot seems to show the address in a standard 'p' tag without a class or id, but you can adjust selectors based on common patterns you observe
    const possibleSelectors = [
      "p",
      ".address",
      '[itemtype="http://schema.org/PostalAddress"]',
    ];

    possibleSelectors.some((selector) => {
      // Use text content of the element to find the address
      const text = $(selector).text();
      // Define a regex that attempts to match street addresses more closely
      // This example looks for a number followed by text, potentially a suite number, and ending with "City, State ZIP" format
      const addressRegex: RegExp =
        /(?:\w+\s*\w+)?\s+([\w\d\s]+)\s*#?([\w\d]+)(?:,\s*[\w\s]+(?:,\s*(?:Second Floor|Suite\s*\d+|\s*Floor\s*\d+)?)?)?\s*,\s*[A-Z]{2}\s\d{5}/i;

      const match = addressRegex.exec(text);
      if (match) {
        address = match[0];
        return true; // Break the loop if an address is found
      }
      return false;
    });

    return address;
  }
}
