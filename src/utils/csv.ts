import fs from "fs";
import csvParser from "csv-parser";
import { Parser } from "json2csv";

export const readFromCSV = (filePath: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const results: string[] = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("data", (data) => {
        results.push(data);
      })
      .on("end", () => resolve(results))
      .on("error", (error) => reject(error));
  });
};

export const writeToCSV = (data: object[], filePath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(data);

    fs.writeFile(filePath, csv, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
};
