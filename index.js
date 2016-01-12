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
    fdf = require("fdf"),
    fs = require("fs");

var pdffiller = {

    getFdf: function(sourceFile, callback){
        this.getFormFields(sourceFile, function(err, formFields){
           if(err){
               return callback(err);
           }
           var fields = {};
           formFields.forEach(function(formField){
               fields[formField.fieldName] = "";
           });
           return callback(null, fdf.generate(fields));
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

    fillForm: function (sourceFile, destinationFile, data, callback) {

        //Generate the data from the field values.
        var fdfData = fdf.generate(data),
            tempFdfFile = "data." + (new Date().getTime()) + ".fdf";
        //Write the temp fdf file.
        fs.writeFile(tempFdfFile, fdfData, function (err) {
            if (err) {
                return callback(err);
            }

            child_process.exec("pdftk " + sourceFile + " fill_form " + tempFdfFile + " output " + destinationFile + " flatten", function (error, stdout, stderr) {
               if (error) {
                    console.log('exec error: ' + error);
                    return callback(error);
                }
                //Delete the temporary fdf file.
                fs.unlink(tempFdfFile, function (err) {
                    if (err) {
                        return callback(err);
                    }
                    return callback();
                });
            });
        });
    }
};

module.exports = pdffiller;


