import getData from './modules/loadData.js'
import transform from './modules/transformData.js'

getData()
    .then(string => transform.createIndividualObjects(string))
    .then(data => transform.createArray(data))
    .then(data => console.log(data))
    .catch(err => console.log(err))

//TODO:
//csv heeft lege waardes niet vervangen, dit resulteert in ;;
//inkomen 1 & inkomen 2 fixen
//maak JSON objecten per huishouden, stop deze allemaal in een array