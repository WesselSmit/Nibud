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

    console.log(result[0])

    // console.log(result)
    const cleanData = result.map(obj => {
        return {
            post: obj.Post,
            huishoudType: obj.Huishouden,
            woonsituatie: obj.Woonsituatie,
            inkomen: obj.Inkomen,
            bedrag: obj.Bedrag
        }
    })

    console.log(cleanData)

    return result
}

export function createArray(data) {
    console.log(data[0].Huishouden)


    // return data
}