const util = require('util');
const Constants = require('./constants.js');

/**
 * @return {String} str but without leading whitespace and quotes ' or ", returns str if there are no quotes
 */
exports.stripQuotes = function(str) {
    if(exports.hasQuotes(str)) {
        return str.trim().replace(/^'|^"|'$|"$/g, '');
    }
    else {
        return str;
    }
}

/**
 * @return {Boolean} true if str is in 'quotes' or "quotes", false otherwise
 */
exports.hasQuotes = function(str) {
    return str.trim().match(Constants.STRING_LITERAL_REGEX_WHOLE) != null;
}

/**
 * Throws an Error with the given message, filename, and line number
 * @throws {Error}
 */
exports.error = function(msg, filename, lineNumber) {
    throw exports.createError(msg, filename, lineNumber);
}

/**
 * @return {Error} An Error with the given message, filename, and line number
 */
exports.createError = function(msg, filename, lineNumber) {
    if(filename && lineNumber) {
        return new Error(msg + " [" + filename + ":" + lineNumber + "]");
    }
    else {
        return new Error(msg);
    }
}

/**
 * Logs the given object to console
 */
exports.log = function(obj) {
    console.log(util.inspect(obj, {depth: null}));
}

/**
 * Prints an array of branches to console
 * @param {Array} Array of Branch to print out
 */
exports.printBranches = function(branches) {
    for(var i = 0; i < branches.length; i++) {
        console.log(branches[i].output("Branch " + i));
    }
}

/**
 * @return {String} A random string of characters
 */
exports.randomId = function() {
    var id = '';
    for(var i = 0; i < 4; i++) {
        id += Math.random().toString(36).substr(2, 34);
    }
    return id;
}
