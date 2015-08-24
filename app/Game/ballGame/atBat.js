/**
 * This is the function that pits the pitcher against the batter.
 * @param  {object} pitcher  The player object of the current pitcher.
 * @param  {object} batter   The player object of the current batter.
 * @param  {object} fielders An object that holds the current fielders. See fielding function in intersect.js
 * @param  {object} count    An object that holds the the current balls and strikes. The intial call of this function the should be undefined.
 * @return {string}          The result of the at bat: the hit result, or out, strikeout, or walk.
 */
var atBat = function(pitcher, batter, fielders, count){
    if(!count){
        count = {
            ball: 0,
            strike: 0
        }
    }

    //creating the indicator object for the pitcher.
    var indicators = {};
    Object.keys(batter.batStyle).forEach(function(key){ indicators[key] = batter.batStyle[key].toString(); });
    Object.keys(count).forEach(function(key){ indicators[key] = count[key].toString(); });

    //creating the pitch and swing objects. Then running them through the intersection
    var pitch = pitcher.pitch(pitcher, indicators);
    var swing = batter.swing(batter, pitch);
    var result = intersect(pitch, swing);
    if(['strike', 'ball', 'homerun'].indexOf(result) != -1){
        result = fielding(result, swing.hittersChance, fielders);
    }

    //these are the logic gates for the various possible outcomes of the intersect function
    if(['strike', 'ball', 'foul'].indexOf(result) != -1){
        //this is if the pitch was not hit, or a foul ball.
        if(result == 'foul'){
            if(count['strike'] < 2){
                count['strike'] += 1;
            }
        }else{
            count[result] += 1;
        }

        if(count.ball > 3){
            return 'walk';
        }else if(count.strike > 2){
            return 'strikeout';
        } else{
            return atBat(pitcher, batter, fielders, count);
        }
    } else {
        return result;
    }
}

/**
 * This is the intersection of the swing and pitch, determining the results.
 * @param  {object} pitch The pitch object that is created by the pitcher
 * @param  {object} swing The swing object that is created by the batter, in response to the pitch.
 * @return {string}       a single word response on the result of the intersection; 'strike', 'ball', 'single', etc. This is without fielding.
 */
function intersect(pitch, swing){
    if(!swing.type === 'noSwing'){
        //determining the chance the batter has to hit the ball.
        var hittersChance = swing.contact + swing.seen * 5;
        if(swing.type === 'power'){
            hittersChance = hittersChance - 10;
        }
        Object.keys(swing).filter(function(key){ return ['vert', 'hori'].indexOf(key) !== -1 }).forEach(function(key){
            if(pitch[key] === swing[key]){
                hittersChance += 5;
            }else if(swing[key] === 'middle'){
                hittersChance += 2;
            }else{
                hittersChance -= 5;
            }
        })
        if(pitch.curve === 'true' && swing.wait === 'true'){
            hittersChance += 5;
        }

        //determining the chance that the pitch will 'miss' the batter.
        var pitchersChance = pitch.speed;
        if(pitch.curve === 'true'){
            pitchersChance += pitch.curve * 2;
        } else{
            pitchersChance += pitch.speed;
        }

        //determine wheter the batter hits the pitch, and the outcome of that.
        swing.hitCheck = randNum(hittersChance);
        pitch.pitchCheck = randNum(pitchersChance);
        if( swing.hitCheck > pitch.pitchCheck){
            var baseCha = baseChances(pitch, swing), fate = randNum(100);
            swing.hittersChance = hittersChance;
            return baseCha.reduce(function(old, curr){
                if(!old && curr.chance <= fate){
                    return curr
                } else{
                    return old
                }
            }, 0).type;
        }else {
            //he missed the ball
            return 'strike';
        }
    } else{
        //the batter takes what ever the pitch was because he doesnt swing
        return pitch.strike;
    }
};

/**
 * function to generate the chance for each type of hit
 * @param  {object} pitch the pitch object from the pitcher
 * @param  {object} swing the swing object from the batter
 * @return {array}       an array of objects that have type and chance attributes.
 */
function baseChances(pitch, swing){
    var heightMod = 0;
    if(pitch.vert == 'high'){
        heightMod = 20;
    } else if(pitch.vert == 'low'){
        heightMod = -20;
    }

    var foul = 0, single = 0, double = 0, triple = 0, homerun = 0, coef = 1;
    if(swing.type == 'power'){
        coef = 2;
    }
    single = (swing.hitCheck - heightMod)/coef;
    foul = ((60 - heightMod)/coef) - single;
    homerun = swing.power/(2*coef),
    triple = swing.power/(4*coef);
    double = 100 - (foul+single+triple+homerun);

    return [{chance: foul, type: 'foul'},
        {chance: single, type: 'single'},
        {chance: double, type: 'double'},
        {chance: triple, type: 'triple'},
        {chance: homerun, type: 'homerun'}
    ];
}

/**
 * This is the function that represents the fielding of the defense.
 * @param  {string} hit      A string representing what kind of hit was made. Cannot be 'homerun';
 * @param  {number} contact  A number representing the batters contact with the ball; is hittersChance from intersect.
 * @param  {object} fielders An object that has the defensive players stored under 'first'(base) and 'outfield'
 * @return {string}          returns the hit string if there is no out, otherwise returns 'out'.
 */
function fielding(hit, contact, fielders){
    if(hit === 'single'){
        if(randNum(fielders.first.attributes.agility) > 100 - contact){
            return hit;
        } else if(randNum(fielders.first.attributes.throwing) < randNum(100)){
            return 'out';
        } else{
            return hit;
        }
    }else{
        var awareCheck = randNum(100);
        var catchAtt = fielders.outfield.reduce(function(old, curr){
            if(awareCheck < randNum(curr.attributes.awareness)-contact && (old.attributes.catching < curr.attributes.catching || !old.attributes)){
                return curr;
            }else{
                return old;
            }
        }, 'none');
        if(catchAtt == 'none' || randNum(fielders.first.attributes.catching) < randNum(100)){
            return hit;
        }else {
            return 'out';
        }
    }
}
