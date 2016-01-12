/*
*   File:       index.js (pdffiller)
*   Project:    PDF Filler
*   Date:       May 2015.
*
*   Description: This PDF filler module takes a data set and creates a filled out
*                PDF file with the form fields populated.
*/
"use strict";
var child_process = require("child_process"),
    exec = child_process.exec,
    spawn = child_process.spawn,
    fdf = require("fdf"),
    util = require("util"),
    fs = require("fs");

var pdffiller = {

    getFdf: function (sourceFile, callback) {
        var pdftkCommand = "pdftk " + sourceFile + " generate_fdf output -";
        exec(pdftkCommand, function (err, stdout, stderr) {
            if (err) {
                console.log(err);
                return callback(err);
            }
            return callback(null, stdout.toString());


        });
    },

    getFormFields: function (sourceFile, callback) {
        var pdftkCommand = "pdftk " + sourceFile + " dump_data_fields_utf8";
        exec(pdftkCommand, function (err, stdout, stderr) {
            if (err) {
                console.log(err);
                return callback(err);
            }
            var fieldSections = stdout.toString().split("---").slice(1);
            var formFields = fieldSections.map(function (fieldSection) {
                var fieldAttributes = fieldSection.split(/\n/);
                var result = {};
                fieldAttributes.forEach(function (fieldAttribute) {
                    var packedAttribute = fieldAttribute.split(/:/);
                    var key = packedAttribute[0];
                    var value = packedAttribute[1];
                    if (key) {
                        key = key[0].toLowerCase() + key.substring(1); // properJavascriptCase TODO: Is this best practice????
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
        var fdfData = fdf.generate(data);
        var child = child_process.spawn("pdftk", [inputFile, "fill_form", "-","output", "-", "flatten"]);
        var buffers = [];
        var buffersLength = 0;
        child.stdout.on("data", function(data){
            buffers.push(data);
            buffersLength += data.length;
         });
        
        child.on("error", function(err){
            return callback(err);
        });
        
        child.on("close", function(){
            data = Buffer.concat(buffers, buffersLength);
            return callback(null, data);
        });
        child.stdin.write(fdfData);
        child.stdin.end();
    }
};

module.exports = pdffiller;



