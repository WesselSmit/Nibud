export default {
    createIndividualObjects,
    createHousehold
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

export function createHousehold(data) {
    let obj
    const arr = []

    for (let i = 0; i < data.length / 24; i++) { //loop through all row-objects
        let uitgavenArr = [],
            totalePostenBedrag = 0
        for (let j = 0; j < 24; j++) { //loop through all individual key/values-pairs
            if (j === 0 || j === 1 || j === 23) {
                //unnecessary grouped values
            } else if (j === 13 || j === 19 || j === 22) {
                totalePostenBedrag += data[(i * 24) + j].Bedrag //calc total expense
            } else {
                obj = { //create expense objects
                    post: data[(i * 24) + j].Post,
                    bedrag: data[(i * 24) + j].Bedrag
                }
                uitgavenArr.push(obj)
            }

            obj = { //create household object
                huishoudType: data[(i * 24) + j].Huishouden,
                woonsituatie: data[(i * 24) + j].Woonsituatie,
                inkomen: data[(i * 24) + j].Inkomen,
                totaleUitgaven: parseInt(totalePostenBedrag),
                uitgavenPosten: uitgavenArr
            }
        }
        if (obj.inkomen === 1 || obj.inkomen === 2) {
            obj.inkomen = obj.totaleUitgaven //fix all 'inkomen' generalizations
        }
        arr.push(obj)
    }
    return arr
}