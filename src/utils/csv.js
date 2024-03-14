"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeToCSV = exports.readFromCSV = void 0;
const fs_1 = __importDefault(require("fs"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const json2csv_1 = require("json2csv");
const readFromCSV = (filePath) => {
    return new Promise((resolve, reject) => {
        const results = [];
        fs_1.default.createReadStream(filePath)
            .pipe((0, csv_parser_1.default)())
            .on("data", (data) => {
            results.push(data);
        })
            .on("end", () => resolve(results))
            .on("error", (error) => reject(error));
    });
};
exports.readFromCSV = readFromCSV;
const writeToCSV = (data, filePath) => {
    return new Promise((resolve, reject) => {
        const json2csvParser = new json2csv_1.Parser();
        const csv = json2csvParser.parse(data);
        fs_1.default.writeFile(filePath, csv, (error) => {
            if (error) {
                reject(error);
            }
            else {
                resolve();
            }
        });
    });
};
exports.writeToCSV = writeToCSV;
