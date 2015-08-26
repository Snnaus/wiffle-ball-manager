
/**
 * A function to return a random number between the max and min; usually for attributes
 * @param  {number} max the highest number that the random# can be
 * @param  {number} min the lowest number the random# can be
 * @return {number}     the generated WHOLE number
 */
var randNum = function(max, min){
    if(!min){
        min = 1;
    }
    if(!max){
        max = 10;
    }
    return Math.floor(Math.random()*(max-min))+min;
};

/**
 * The contructer for the individual player objects
 * @param {object} params An object of assorted params for the creation of the player.
 */
function Player(params){
    //general information about the player
    this.id = params.id;
    this.name = params.name;

    //the attributes
    this.attributes = {
        contact: randNum(params.maxPot, params.minPot),
        power: randNum(params.maxPot, params.minPot),
        eye: randNum(params.maxPot, params.minPot),
        speed: randNum(params.maxPot, params.minPot),
        curve: randNum(params.maxPot, params.minPot),
        awareness: randNum(params.maxPot, params.minPot),
        agility: randNum(params.maxPot, params.minPot),
        catching: randNum(params.maxPot, params.minPot),
        throwing: randNum(params.maxPot, params.minPot),
        pitchStamina: randNum(params.maxPot, params.minPot),
        pitchControl: randNum(params.maxPot, params.minPot),
        fieldingStamina: randNum(params.maxPot, params.minPot)
    };


    //in-game identifiers for the pitcher
    this.batStyle = {
        power: false,
        contact: false
    }
    this.pitchCount = 0;
    this.ledger = [];

    //Stats
    //pastSeasons and playoffs is formatted like JSON, where each season is a key to the stats object
    this.gameStats = {
        batting: {
            G: 0,
            PA: 0,
            AB: 0,
            R: 0,
            H: 0,
            '2B': 0,
            '3B': 0,
            HR: 0,
            RBI: 0,
            SO: 0,
            BB: 0
        },
        pitching: {
            G: 0,
            GS: 0,
            IP: 0,
            H: 0,
            R: 0,
            HR: 0,
            BB: 0,
            SO: 0
        }
    }
    this.currentSeason = {};
    this.pastSeasons = {};
    this.playoffs = {};

    //These are the players 'brains' in regards to pitching and batting; formatted like JSON with keys relative to count (and ball strike for batting)
    this.batBrain = {};
    this.pitchBrain = {};
};

/**
 * Swinging at a pitch
 * @param  {object} self  the player object passed as this
 * @param  {object} pitch the pitch object from the pitcher
 * @return {object}       swing object
 */
Player.prototype.swing = function (self, pitch) {
    //an array of the parts of a pitch (objects), that inlfuence the batter
    var parts = Object.keys(pitch).filter(function(part){ return ['vert', 'hori', 'strike', 'curve'].indexOf(part) !== -1 }).map(function(part){
        return {
            part: part,
            type: pitch[part],
            seen: randNum(100) < self.attributes.eye * 4
        }
    });
    var swing = {};
    //attributing the parts of the swing based on the pitch; no including the type of swing.
    parts.forEach(function(part){
        if(part.part != 'strike'){
            if(part.seen){
                swing[part.part] = part.type;
            }else{
                swing[part.part] = 'middle';
                if(part.part == 'curve'){
                    swing[part.part] = false;
                }
            }
        }
    })

    pitch.count.current = parts.filter(function(part){ return part.part === 'strike' && part.seen})[0];
    if(pitch.count.current){
        pitch.count.current = pitch.count.current.type;
    }
    //the pitch.count needs to be an array of strings with [balls, strikes, current pitch strike?]
    var percept =  Object.keys(pitch.count).reduce(function(agg, curr){ return agg + pitch.count[curr]; });
    swing.type = self.useBatBrain(self, percept);
    self.ledger.push({percept: percept, action: swing.type, type: 'batting'});
    swing.power = self.attributes.power;
    swing.contact = self.attributes.contact;
    swing.seen = parts.filter(function(part){ return part.seen; }).length;
    return swing;
};

/**
 * Accesses the player batBrain to determine which type of swing he should take
 * @param  {object} self the player object passed as this
 * @param  {string} key  a string that is the key to the top level of the brain; is made of the count and current pitch strike boolean
 * @return {string}      string that is the type of swing to take
 */
Player.prototype.useBatBrain = function (self, key) {
    var concept = self.batBrain[key];
    if(concept){
        return Object.keys(concept).reduce(function(old, curr){
            if(concept[old] && concept[old].SLG < concept[curr].SLG){
                return curr;
            } else{
                return old;
            }
        });
    }else{
        self.batBrain[key] = {
            power: {
                attempts: 1,
                hits: 1,
                bases: 1,
                BA: 1,
                SLG: 1,
            },
            contact: {
                attempts: 1,
                hits: 1,
                bases: 1,
                BA: 1,
                SLG: 1,
            },
            noSwing: {
                attempts: 1,
                hits: 1,
                bases: 1,
                BA: 1,
                SLG: 1,
            }
        };
        return self.useBatBrain(self, key);
    }
};

/**
 * Access the brain to determine what to pitch
 * @param  {object} self       player object passed through as this
 * @param  {object} indicators the ingame batter indiactors that each player has
 * @return {object}            Object with all the details of the pitch; to be used by the batter for swing
 */
Player.prototype.pitch = function (self, indicators) {
    var key = Object.keys(indicators).reduce(function(agg, curr){ return agg + indicators[curr]; }, ''), pitch = {};
    var concept = self.pitchBrain[key];
    if(concept){
        Object.keys(concept).forEach(function(part){
            pitch[part] = Object.keys(concept[part]).reduce(function(old, curr){
                if(concept[part][old].SLG >= concept[part][curr].SLG){
                    return curr;
                }else{
                    return old
                }
            });
        });
    }else {
        self.pitchBrain[key] = {
            vert: {
                high: {
                    attempts: 0,
                    hits: 0,
                    bases: 0,
                    BA: 0,
                    SLG: 0,
                },
                low: {
                    attempts: 0,
                    hits: 0,
                    bases: 0,
                    BA: 0,
                    SLG: 0,
                },
                middle: {
                    attempts: 0,
                    hits: 0,
                    bases: 0,
                    BA: 0,
                    SLG: 0,
                }
            },
            hori: {
                inside: {
                    attempts: 0,
                    hits: 0,
                    bases: 0,
                    BA: 0,
                    SLG: 0,
                },
                outside: {
                    attempts: 0,
                    hits: 0,
                    bases: 0,
                    BA: 0,
                    SLG: 0,
                },
                middle: {
                    attempts: 0,
                    hits: 0,
                    bases: 0,
                    BA: 0,
                    SLG: 0,
                }
            },
            strike: {
                strike: {
                    attempts: 0,
                    hits: 0,
                    bases: 0,
                    BA: 0,
                    SLG: 0,
                },
                ball: {
                    attempts: 0,
                    hits: 0,
                    bases: 0,
                    BA: 0,
                    SLG: 0,
                }
            },
            curve: {
                yes: {
                    attempts: 0,
                    hits: 0,
                    bases: 0,
                    BA: 0,
                    SLG: 0,
                },
                no: {
                    attempts: 0,
                    hits: 0,
                    bases: 0,
                    BA: 0,
                    SLG: 0,
                }
            }
        }
        return self.pitch(self, indicators);
    }

    //changing whether the pitch is a strike or a ball based on a stamina check
    if(randNum(100) < self.pitchCount - (self.attributes.pitchStamina + self.attributes.pitchControl)*4){
        pitch.strike = 'ball';
        /*if(pitch.strike === 'yes' && pitch.vert != 'middle' || pitch.hori != 'middle'){
            pitch.strike = 'ball';
        } else{
            pitch.strike = 'strike';
        }*/
    }

    pitch.count = {
        ball: indicators.ball,
        strike: indicators.strike
    }
    self.pitchCount = self.pitchCount + 1;
    pitch.speed = self.attributes.speed;
    pitch.curveStat = self.attributes.curve;
    self.ledger.push({percept: key, action: pitch, type: 'pitch'});
    return pitch;
};

/**
 * This method updates the players currentSeason stats after each game.
 * @param  {object} self The player object.
 * @return {none}      Adjusts the object attributes inside the player.
 */
Player.prototype.updateSeasonStats = function (self) {
    //moving the gameStats to the currentSeason stats.
    Object.keys(self.gameStats).forEach(function(key){
        if(self.currentSeason[key]){
            Object.keys(self.gameStats[key]).forEach(function(newKey){
                self.currentSeason[key][newKey] = self.currentSeason[key][newKey] + self.gameStats[key][newKey];
            });
        }else{
            var stats = Object.keys(self.gameStats[key]).reduce(function(old, curr){
                old[curr] = self.gameStats[key][curr];
                return old;
            }, {});
            self.currentSeason[key] = stats;
        }
    });

    //reseting the gameStats
    self.gameStats = {
        batting: {
            G: 0,
            PA: 0,
            AB: 0,
            R: 0,
            H: 0,
            '2B': 0,
            '3B': 0,
            HR: 0,
            RBI: 0,
            SO: 0,
            BB: 0
        },
        pitching: {
            G: 0,
            GS: 0,
            IP: 0,
            H: 0,
            R: 0,
            HR: 0,
            BB: 0,
            SO: 0
        }
    }
};

/**
 * This updates the 'brains' of the player after the atBat
 * @param  {object} self   The player object, whos 'brain' is being updated.
 * @param  {string} result The result of the atBat
 */
Player.prototype.updateBrain = function (self, result) {
    if(result == 'homerun'){
        result = 4;
    }else if(result == 'triple'){
        result = 3;
    }else if(result == 'double'){
        result = 2;
    }else if(result == 'single' || result == 'walk'){
        result = 1;
    }else{
        result = 0;
    }

    if(self.ledger[0].type == 'pitch'){
        self.ledger.forEach(function(event){
            var pitch = event.action;
            Object.keys(pitch).filter(function(key){ return ['curveStat', 'count', 'speed', 'pitchCheck'].indexOf(key) === -1; }).forEach(function(key){
                self.pitchBrain[event.percept][key][pitch[key]].attempts = parseInt(self.pitchBrain[event.percept][key][pitch[key]].attempts) + 1;
                self.pitchBrain[event.percept][key][pitch[key]].bases = parseInt(self.pitchBrain[event.percept][key][pitch[key]].bases) + parseInt(result);
                self.pitchBrain[event.percept][key][pitch[key]].SLG = parseFloat(parseInt(self.pitchBrain[event.percept][key][pitch[key]].bases) / parseInt(self.pitchBrain[event.percept][key][pitch[key]].attempts));
            });
        });
    }else{
        self.ledger.forEach(function(event){
            self.batBrain[event.percept][event.action].attempts = parseInt(self.batBrain[event.percept][event.action].attempts) + 1;
            self.batBrain[event.percept][event.action].bases = parseInt(self.batBrain[event.percept][event.action].bases) + parseInt(result);
            self.batBrain[event.percept][event.action].SLG = parseFloat(self.batBrain[event.percept][event.action].bases / self.batBrain[event.percept][event.action].attempts);
        });
    }
};
