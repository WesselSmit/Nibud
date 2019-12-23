import getData from './modules/loadData.js'
import transform from './modules/transformData.js'

getData()
    .then(string => transform.createIndividualObjects(string))
    .then(csvRows => transform.createHousehold(csvRows))
    .then(data => console.log(data))
    .catch(err => console.log(err))



const allInputs = d3.selectAll('#uw_situatie input, #uw_situatie select')._groups[0]
const allQuestionCategories = d3.selectAll('.question_category')._groups[0]

document.querySelectorAll('#uw_situatie input, #uw_situatie select').forEach(input => input.addEventListener('input', function () {
    //progress-bar
    let inputsWithValue = 0,
        numberOfTotalRadio = 0

    allInputs.forEach(input => {
        if (input.tagName === 'SELECT' && input.value != '' ||
            input.type === 'radio' && input.checked === true ||
            input.type !== 'radio' && input.tagName !== 'SELECT' && input.value != '') {
            inputsWithValue++
        }
        if (input.type === 'radio') {
            numberOfTotalRadio++
        }
    })
    let uniqueInputs = allInputs.length - (numberOfTotalRadio / 2), // '-3' is to prevent the radio buttons of taking up double-spaces
        progression = document.querySelector('#uw_situatie #progression').parentElement.getBoundingClientRect().width / uniqueInputs * inputsWithValue //
    document.querySelector('#uw_situatie #progression').style.paddingRight = progression + "px"


    //answer indicator
    // TODO: let op onderstaande notities:
    // ! deze methode houd geen rekening met de verschillende dynamische inputs
    // ! alle mogelijke inputs binnen de huidige fieldset worden opgehaald
    // ! dit betekent dat alle dynamische inputs (alle inputs die afhangen van de antwoorden van de gebruiker) moeten dynamisch gemaakt worden (d3 of JS)
    // ! chech hier de HMTL nog ff op, want op dit moment staan alle mogelijkheden in de HTML -> deze moeten dus dynamisch aangemaakt gaan worden
    // ! als deze dynamisch aangemaakt worden dan werkt deze functie, als je dit niet doet dan moet je deze functie herschrijven
    let currentEl = this
    while (currentEl.classList.contains('question_category') != true) {
        currentEl = currentEl.parentElement
    }

    const allCurrentInputs = currentEl.querySelectorAll('input, select')
    let answeredQuestions = 0,
        numberOfRadio = 0

    for (const currentInput of allCurrentInputs) {
        if (currentInput.type === 'radio' && currentInput.checked === true || currentInput.type !== 'radio' && currentInput.value != '') {
            answeredQuestions++
        }
        if (currentInput.type === 'radio') {
            numberOfRadio++
        }
    }

    if (answeredQuestions === allCurrentInputs.length - (numberOfRadio / 2)) {
        currentEl.querySelector('div>span').classList.add('hasAnswer')
    } else {
        currentEl.querySelector('div>span').classList.remove('hasAnswer')
    }
}))

//progressive disclosure
allQuestionCategories.forEach(category => {
    category.addEventListener('click', function () {
        for (const question of allQuestionCategories) {
            question.classList.remove('hide')
            question.classList.add('hide')
        }
        this.classList.remove('hide')
        for (const category of allQuestionCategories) {
            category.querySelector('div:first-of-type>img').classList.remove('activeDropdown')
        }
        category.querySelector('div:first-of-type>img').classList.add('activeDropdown')
    })
})