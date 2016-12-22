const request = require('request');
const cheerio = require('cheerio');
const numSearchResults = process.env.NUM_SEARCH_RESULTS;

function search (cardName, callback) {
    var terms = cardName.split(/ +/g);
    var uri = 'http://gatherer.wizards.com/Pages/Search/Default.aspx?name=';
    for (var i = 0; i < terms.length; i++) {
        if (terms[i] != '') uri += '+[' + terms[i] + ']';
    }

    request({
        uri: uri,
        followRedirect: false
    }, function (err, res, body) {
        if (err) {
            return callback(err);
        } else if (res.statusCode == 200) {
            // Invalid Card Name
            var $ = cheerio.load(body);
            return callback(false, false, $('.cardItem .cardTitle a').map(function (i) {
                if (i >= numSearchResults) return null;
                return $(this).text();
            }).toArray());
        } else if (res.statusCode == 302) {
            // Valid Card Name
            return callback(false, res.headers['location'].split('=')[1]);
        } else {
            // Unrecognized status code
            return callback('Unrecognized status code: ' + res.statusCode);
        }
    });
}

function getImageUri (multiverseId) {
    return 'http://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=' + multiverseId + '&type=card';
}

function getRulings (multiverseId, callback) {
    request('http://gatherer.wizards.com/Pages/Card/Details.aspx?multiverseid=' + multiverseId, function (err, res, body) {
        if (err) {
            return callback(err);
        } else if (res.statusCode == 200) {
            var $ = cheerio.load(body);
            return callback(false, $('.rulingsTable tr').map(function () {
                var tds = $(this).find('td');
                return {
                    date: $(tds[0]).text().trim(),
                    text: $(tds[1]).text().trim()
                }
            }).toArray());
        } else {
            // Unrecognized status code
            return callback('Unrecognized status code: ' + res.statusCode);
        }
    });
}

function getSets (multiverseId, callback) {
    request('http://gatherer.wizards.com/Pages/Card/Printings.aspx?multiverseid=' + multiverseId, function (err, res, body) {
        if (err) {
            return callback(err);
        } else if (res.statusCode == 200) {
            var $ = cheerio.load(body);
            return callback(false, $($('.cardList')[0]).find('.cardItem').map(function () {
                var block = $(this).find('.column4').text().trim();
                if (block == 'Miscellaneous' || block == 'General') block = false;
                return {
                    set: $($(this).find('td')[2]).text().trim(),
                    block: block
                }
            }).toArray());
        } else {
            // Unrecognized status code
            return callback('Unrecognized status code: ' + res.statusCode);
        }
    });
}

module.exports = {
    search: search,
    getImageUri: getImageUri,
    getRulings: getRulings,
    getSets: getSets
}