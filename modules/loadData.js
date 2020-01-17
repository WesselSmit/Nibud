export default {
    getData,
    getTooltips,
    getHighestExpenses
}

export async function getData() {
    const response = await fetch('../dataset.csv') //fetch data
    const csv = await response.text() //convert data to string
    return csv
}

export async function getTooltips() {
    const response = await fetch('../tooltip.json')
    const json = await response.json()
    return json.tooltips[0]
}

export async function getHighestExpenses() {
    const response = await fetch('../bespaartips.json')
    const json = await response.json()
    return json.bespaartips[0]
}

