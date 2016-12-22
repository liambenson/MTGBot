const discord = require('discord.js');
const gatherer = require('./gatherer.js');
const helper = require('./helper.js');

require('dotenv').config();

var bot = new discord.Client();

bot.on('ready', function () {
    console.log('MTGBot online!');
});

bot.on('message', function (msg) {
    if (msg.content.search(/^<<(\w| |\.|"|,|\!)+>>( +\!(\w)+)*$/) != -1) {
        var cardName = msg.content.match(/<<((?:\w| |\.|"|,|\!)+)>>/)[1];
        var userParams = msg.content.split(/ +\!/g).slice(1);
        var unrecognizedParams = [];
        var params = {
            noImage: false,
            rulings: false,
            sets: false
        }
        for (var i = 0; i < userParams.length; i++) {
            if (params[userParams[i]] === false) {
                params[userParams[i]] = true;
            } else if (!params[userParams[i]]) {
                unrecognizedParams.push(userParams[i]);
            }
        }

        gatherer.search(cardName, function (err, multiverseId, results) {
            if (err) {
                console.log('Searching for a card name on gatherer failed:');
                console.log(err);
                msg.channel.sendMessage('I had a mental misstep searching for that card');
                return;
            } else if (!multiverseId) {
                var message = 'That card does not exist.' + (results.length ? ' Did you mean:' : '');
                for (var i = 0; i < results.length; i++) {
                    message += '\n' + '<<' + results[i] + '>>';
                }
                msg.channel.sendMessage(message);
                return;
            }

            if (!params.noImage) msg.channel.sendFile(gatherer.getImageUri(multiverseId), 'cardImage.png');

            var toDo = [];
            if (params.rulings) {
                toDo.push(function (callback, index) {
                    gatherer.getRulings(multiverseId, function (err, rulings) {
                        if (err) {
                            console.log('Getting rulings for ' + cardName + ' failed');
                            console.log(err);
                            return callback(index, 'I had a mental misstep finding rulings!\n');
                        } else if (!rulings.length) {
                            return callback(index, 'No rulings found!\n');
                        }

                        var message = 'Rulings:\n';
                        for (var i = 0; i < rulings.length; i++) {
                            message += rulings[i].date + ': ' + rulings[i].text + '\n';
                        }
                        return callback(index, message);
                    });
                });
            }

            if (params.sets) {
                toDo.push(function (callback, index) {
                    gatherer.getSets(multiverseId, function (err, sets) {
                        if (err) {
                            console.log('Getting sets for ' + cardName + ' failed');
                            console.log(err);
                            return callback(index, 'I had a mental misstep finding sets!\n');
                        }

                        var message = 'Sets: ' + sets[0].set;
                        if (sets[0].block) message += ' (' + sets[0].block + ')';
                        for (var i = 1; i < sets.length; i++) {
                            message += ', ' + sets[i].set;
                            if (sets[i].block) message += ' (' + sets[i].block + ')';
                        }
                        message += '\n';

                        return callback(index, message);
                    });
                });
            }

            helper.asyncOrder(toDo, function (messages) {
                msg.channel.sendMessage(messages.join('\n'));
            });
        });
    }
});

bot.login(process.env.BOT_TOKEN);