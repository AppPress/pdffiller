/*
*   File:       pdf.js
*   Project:    PDF Filler
*   Date:       June 2015.
*
*/

var pdfFiller = require('../index'), 
    should = require('should'),
    data = require('./data'),
    mocha = require("mocha");

/**
 * Unit tests
 */
describe('pdfFiller Tests', function(){

    describe('fillForm()', function(){

        var _data = {
            "first_name" : "John",
            "last_name" : "Doe",
            "date" : "Jan 1, 2013",
            "football" : "Off",
            "baseball" : "Yes",
            "basketball" : "Off",
            "hockey" : "Yes",
            "nascar" : "Off"
        };

        it('should not throw an error when creating test_complete.pdf from test.pdf with filled data', function(done) {
            this.timeout(15000);
            pdfFiller.fillForm( data.test1.sourceFile, data.test1.sourceFile + "_completed.pdf", _data, function(err) { 
                should.not.exist(err);
                done();
            });
        });
    });

    describe('getFormFields', function(){

        it('should generate form fields as expected test1', function(done){
            this.timeout(15000);
            pdfFiller.getFormFields( data.test1.sourceFile,  function(err, form_fields) { 
                should.not.exist(err);
                form_fields.should.eql(data.test1.expected.formFields);
                done();
            });
        });

        it('should generate form fields as expected test2', function(done){
            this.timeout(15000);
            pdfFiller.getFormFields( data.test2.sourceFile, function(err, form_fields) { 
                should.not.exist(err);
                form_fields.should.eql(data.test2.expected.formFields);
                done();
            });
        });
    });

    describe('getFDF()', function(){
        it('should generate FDF for source pdf 1', function(done){
            this.timeout(15000);
            pdfFiller.getFdf( data.test1.sourceFile, function(err, fdfTemplate) { 
                should.not.exist(err);
                fdfTemplate.should.eql(data.test1.expected.fdf);
                done();
            });
        });

        it('should generate FDF for source pdf 2', function(done){
            this.timeout(15000);
            pdfFiller.getFdf( data.test2.sourceFile, function(err, fdfTemplate) { 
                should.not.exist(err);
                fdfTemplate.should.eql(data.test2.expected.fdf);
                done();
            });
        });

    });
});





