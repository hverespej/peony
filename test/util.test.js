var chai = require('chai');
var expect = chai.expect;

var util = require('../utils');

describe('util', function() {
	describe('hash.djb2', function() {
		it('Should produce numeric values from various types of objects', function() {
			expect(util.hash.djb2(null)).to.be.a('number');
			expect(util.hash.djb2('')).to.be.a('number');
			expect(util.hash.djb2(123)).to.be.a('number');
			expect(util.hash.djb2('123')).to.be.a('number');
			expect(util.hash.djb2([1, 2, 3])).to.be.a('number');
			expect(util.hash.djb2({ a: 1, b: 2, c: 3 })).to.be.a('number');
		});

		it('Should produce different values for similar objects', function() {
			expect(util.hash.djb2(1)).to.not.equal(util.hash.djb2('1'));
		});

		it('Should behave deterministically', function() {
			expect(util.hash.djb2(1)).to.equal(util.hash.djb2(1));
		});

		it('Should not be affected by member functions', function() {
			var obj1 = { a: 1, b: 2 };
			var obj2 = { a: 1, b: 2, c: function() { return 3; } };
			expect(util.hash.djb2(obj1)).to.equal(util.hash.djb2(obj2));
		});

		it('Should fail for undefined object', function() {
			expect(function() { util.hash.djb2(); }).to.throw(TypeError);
		});
	});
});
