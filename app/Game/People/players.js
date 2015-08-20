
/**
 * A function to return a random number between the max and min; usually for attributes
 * @param  {number} max the highest number that the random# can be
 * @param  {number} min the lowest number the random# can be
 * @return {number}     the generated WHOLE number
 */
var newAttr = function(max, min){
    if(!min){
        min = 1;
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
        contact: newAttr(10),
        power: newAttr(10),
        eye: newAttr(10),
        speed: newAttr(10),
        curve: newAttr(10),
        awareness: newAttr(10),
        catching: newAttr(10),
        throwing: newAttr(10),
        pitchStamina: newAttr(10),
        pitchControl: newAttr(10),
        fieldingStamina: newAttr(10)
    };


};

var test = new Player({
    ID: 'test',
    name: 'test'
})
console.log(test);
