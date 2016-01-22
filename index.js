/*
*   File:       index.js (pdffiller)
*   Project:    PDF Filler
*   Date:       May 2015.
*
*   Description: This PDF filler module takes a data set and creates a filled out
*                PDF file with the form fields populated.
*/
"use strict";

const child_process = require("child_process");
const exec = child_process.exec;
const spawn = child_process.spawn;
const fdf = require("fdf");
const PDFDocument = require("pdfkit");

const pdffiller = {

	getFdf: function (sourceFile, callback) {
		const pdftkCommand = `pdftk ${sourceFile} generate_fdf output -`;

		exec(pdftkCommand, (err, stdout) => {
			if (err) {
				console.log(err);
				return callback(err);
			}

			return callback(null, stdout.toString());
		});
	},

	getFormFields: function (sourceFile, callback) {
		const pdftkCommand = `pdftk ${sourceFile} dump_data_fields_utf8`;

		exec(pdftkCommand, (err, stdout) => {
			if (err) {
				console.log(err);
				return callback(err);
			}

			const fieldSections = stdout.toString().split("---").slice(1);
			const formFields = fieldSections.map((fieldSection) => {
				const fieldAttributes = fieldSection.split(/\n/);
				const result = {};
				fieldAttributes.forEach((fieldAttribute) => {
					const packedAttribute = fieldAttribute.split(/:/);
					let key = packedAttribute[0];
					let value = packedAttribute[1];

					if (key) {
						key = key[0].toLowerCase() + key.substring(1);
						result[key.trim()] = value.trim();
					}
				});

				return result;
			});

			return callback(null, formFields);
		});
	},

	fillForm: function (inputFile, data, callback) {
		// Generate FDF template from data
		const fdfData = fdf.generate(data);
		const child = spawn("pdftk", [inputFile, "fill_form", "-","output", "-", "flatten"]);
		let buffers = [];
		let buffersLength = 0;
		child.stdout.on("data", (data) => {
			buffers.push(data);
			buffersLength += data.length;
		});

		child.on("error", (err) => {
			return callback(err);
		});

		child.on("close", () => {
			data = Buffer.concat(buffers, buffersLength);
			return callback(null, data);
		});

		child.stdin.write(fdfData);
		child.stdin.end();
	},

	stamp: function (inputFile, image, imageLocation, callback) {
		const child = spawn("pdftk", [inputFile, "stamp", "-","output", "-", "flatten"]);

		loadImageToPdf(image, imageLocation, (err, imagePdf) => {
			if (err) {
				return callback(err);
			}

			let buffers = [];
			let buffersLength = 0;

			child.stdout.on("data", (data) => {
				buffers.push(data);
				buffersLength += data.length;
			});

			child.on("error", (err) => {
				return callback(err);
			});

			child.on("close", () => {
				let data = Buffer.concat(buffers, buffersLength);
				return callback(null, data);
			});

			child.stdin.write(imagePdf);
			child.stdin.end();
		});
	},
};

function loadImageToPdf(image, imageLocation, callback) {
	const imagePdf = new PDFDocument();

	let buffers = [];
	let buffersLength = 0;

	imagePdf.on("data", (data) => {
		buffers.push(data);
		buffersLength += data.length;
	});

	imagePdf.on("error", (err) => {
		return callback(err);
	});

	imagePdf.on("end", () => {
		let data = Buffer.concat(buffers, buffersLength);
		return callback(null, data);
	});

	imagePdf.image(image, imageLocation);
	imagePdf.end();
}

module.exports = pdffiller;
