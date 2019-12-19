export default {
    createIndividualObjects
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
    return result
}