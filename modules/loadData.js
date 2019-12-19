export default async function getData() {
    const response = await fetch('../dataset.csv') //fetch data
    const csv = await response.text() //convert data to string
    return csv
}