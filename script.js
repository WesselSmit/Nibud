import getData from './modules/loadData.js'
import transform from './modules/transformData.js'

getData()
    .then(string => transform.createIndividualObjects(string))
    .then(csvRows => transform.createHousehold(csvRows))
    .then(data => console.log(data))
    .catch(err => console.log(err))



//progress-bar
const allInputs = d3.selectAll('#uw_situatie input, #uw_situatie select')._groups[0]

document.querySelectorAll('#uw_situatie input, #uw_situatie select').forEach(input => input.addEventListener('input', function () {
    let inputsWithValue = 0

    allInputs.forEach(input => {
        if (input.tagName === 'SELECT' && input.value != '' || input.type === 'radio' && input.checked === true || input.type !== 'radio' && input.tagName !== 'SELECT' && input.value != '') {
            inputsWithValue++
        }
        // else if (input.type === 'radio' && input.checked === true) {
        //     inputsWithValue++
        // } else if (input.type !== 'radio' && input.tagName !== 'SELECT' && input.value != '') {
        //     inputsWithValue++
        // }
    })
    let uniqueInputs = allInputs.length - 3, // '-3' is to prevent the radio buttons of taking up double-spaces
        progression = document.querySelector('#uw_situatie #progression').parentElement.getBoundingClientRect().width / uniqueInputs * inputsWithValue //
    document.querySelector('#uw_situatie #progression').style.paddingRight = progression + "px"
}))