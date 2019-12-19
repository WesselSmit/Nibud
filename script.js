//form progression bar
let allInputs = d3.selectAll('input')._groups[0]

document.querySelectorAll('input').forEach(input => input.addEventListener('input', function () {
    let inputWithValue = 0
    allInputs.forEach(input => {
        if (input.value != '') {
            inputWithValue++
        }
    })
    let progression = document.querySelector('#progression').parentElement.getBoundingClientRect().width / allInputs.length * inputWithValue
    document.querySelector('#progression').style.paddingRight = progression + "px"
}))


//dataset 
import getData from './modules/loadData.js'
import transform from './modules/transformData.js'

getData()
    .then(string => transform.createIndividualObjects(string))
    .then(data => console.log(data))
    .catch(err => console.log(err))


//TODO:
//csv heeft lege waardes niet vervangen, dit resulteert in ;;
//inkomen 1 & inkomen 2 fixen
//maak JSON objecten per huishouden, stop deze allemaal in een array
// de data transform functie moet in een modules gestopt worden