import getData from './modules/loadData.js'
import transform from './modules/transformData.js'

getData()
    .then(string => transform.createIndividualObjects(string))
    .then(data => transform.createArray(data))
    .then(data => console.log(data))
    .catch(err => console.log(err))
