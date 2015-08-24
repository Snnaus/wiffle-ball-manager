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
    var pitch = pitcher.pitch(this, indicators);
    var swing = batter.swing(this, pitch);
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
