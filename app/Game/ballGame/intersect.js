
/**
 * This is the intersection of the swing and pitch, determining the results.
 * @param  {object} pitch The pitch object that is created by the pitcher
 * @param  {object} swing The swing object that is created by the batter, in response to the pitch.
 * @return {string}       a single word response on the result of the intersection; 'strike', 'ball', 'single', etc. This is without fielding. 
 */
var intersect = function(pitch, swing){
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
        var swing.hitCheck = randNum(hittersChance), pitch.pitchCheck = randNum(pitchersChance);
        if( swing.hitCheck > pitch.pitchCheck){
            var baseCha = baseChances(pitch, swing), fate = randNum(100);
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
var baseChances = function(pitch, swing){
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
