
/**
 * This is the intersection of the swing and pitch, determining the results.
 * @param  {object} pitch The pitch object that is created by the pitcher
 * @param  {object} swing The swing object that is created by the batter, in response to the pitch.
 * @return {string}       a single word response on the result of the intersection; 'strike', 'ball', 'single', 'out', etc.
 */
var intersect = function(pitch, swing){
    if(!swing.type === 'noSwing'){
        //determining the chance the batter has to hit the ball.
        var hittersChance = swing.contact + swing.seen * 5;
        if(swing.type === 'power'){
            hittersChance = hittersChance - 10;
        }
        Object.keys(swing).forEach(function(key){
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
        if(randNum(hittersChance) > randNum(pitchersChance)){
            //code to determine whether the batter is out, or what base he gets.
        }else {
            //he missed the ball
            return 'strike';
        }
    } else{
        //the batter takes what ever the pitch was because he doesnt swing
        return pitch.strike;
    }
};
