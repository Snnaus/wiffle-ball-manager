
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
    return Math.floor(Math.random()*max)+min;
}


/**
 * The contructer for the individual player objects
 * @param {object} params An object of assorted params for the creation of the player.
 */
function Player(params){
    //general information about the player
    this.ID = params.ID;
    this.name = params.name;

    //the attributes
    this.attributes = {
        contact: randNum(),
        power: randNum(),
        eye: randNum(),
        speed: randNum(),
        curve: randNum(),
        awareness: randNum(),
        catching: randNum(),
        throwing: randNum(),
        pitchStamina: randNum(),
        pitchControl: randNum(),
        fieldingStamina: randNum()
    };


    //in-game identifiers for the pitcher
    this.batStyle = {
        power: false,
        contact: false
    }

    //Stats
    //pastSeasons and playoffs is formatted like JSON, where each season is a key to the stats object
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
.Player.prototype.swing = function (self, pitch) {
    //an array of the parts of a pitch (objects), that inlfuence the batter
    var parts = Object.keys(pitch).filter(function(part){ return ['vert', 'lat', 'strike', 'curve'].indexOf(part) !== -1 }).map(function(part){
        return {
            part: part,
            type: pitch[part],
            seen: randNum(100) < self.attributes.eye * 4;
        }
    });
    var swing = {};
    //attributing the parts of the swing based on the pitch; no including the type of swing.
    parts.forEach(function(part){
        if(part.part != 'strike'){
            if(part.seen){
                swing[part.part] = part.type;
            }else{
                swing[part.part] = 'mid';
                if(part.part == 'curve'){
                    swing[part.part] = false;
                }
            }
        }
    })

    //the pitch.count needs to be an array of strings with [balls, strikes, current pitch strike?]
    swing.type = self.useBatBrain(self, pitch.count.reduce(function(agg, curr){ return agg + curr }));
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
                BA: 0,
                SLG: 0,
            },
            contact: {
                attempts: 1,
                hits: 1,
                bases: 1,
                BA: 0,
                SLG: 0,
            },
            noSwing: {
                attempts: 1,
                hits: 1,
                bases: 1,
                BA: 0,
                SLG: 0,
            }
        };
        return 'contact';
    }
};
