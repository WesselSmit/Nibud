export default {
    createIndividualObjects,
    createArray
}

export function createIndividualObjects(string) {
    const lines = string.split('\n'), //break up the massive string
        delimiter = ';'
    let result = [],
        headers = lines[0].split(delimiter) //create object keys

    for (let i = 1; i < lines.length; i++) {
        const obj = {}
        let currentline = lines[i].split(delimiter)

        for (let j = 0; j < headers.length; j++) {
            if (currentline[j].includes('.')) {
                currentline[j] = currentline[j].replace('.', '') //get rid of .
            }

            if (currentline[j].charAt(0) === ' ') {
                currentline[j] = currentline[j].replace(' ', '') //replace unnecessary whitespace 
            }

            if (currentline[j].match(/^\d+$/)) {
                currentline[j] = parseInt(currentline[j]) //convert string to integer
            }

            obj[headers[j]] = currentline[j] //create objects
        }

        result.push(obj) //push all objects to array
    }

    //TODO:
    //maak JSON objecten per huishouden, stop deze allemaal in een array


    // ! Sjors start hier
    /* // TODO - Nice to haves 
    * Alle strings omzetten naar eerste letter met een hoofdletter en derest klein

    */
    const cleanData = result.map(obj => {
        return {
            post: obj.Post.toLowerCase(),
            huishoudType: obj.Huishouden.toLowerCase(),
            woonsituatie: obj.Woonsituatie.toLowerCase(),
            inkomen: obj.Inkomen,
            bedrag: obj.Bedrag
        }
    })

    return cleanData
}

// Bepaal hier aan de hand van de ingevulde data in het form in welke categorie de persoon wordt geplaatsts
// ! andere functienaam
export function createArray(data) {
    var array = []
    data.forEach(row => {
        if (row.huishoudType == "alleenstaand" && row.woonsituatie == "gemiddelde huur" && row.inkomen == 1) {
            console.log(row)
        }
    })
}

// // Function that rewrites every string
// function niceString(string) {
//     var stringToLowerCase = string.toLowerCase()
//     return niceString = stringToLowerCase.charAt(0).toUpperCase() + stringToLowerCase.slice(1)
// }