import getData from './modules/loadData.js'
import transform from './modules/transformData.js'

getData()
    .then(string => transform.createIndividualObjects(string))
    .then(csvRows => transform.createHousehold(csvRows))
    .then(data => console.log(data))
    .catch(err => console.log(err))





// TODO: (voor het eerste form)
// GEZIN
// - kinderen (dynamisch)
// - inkomen (standaard + mogelijk partner)
// HUIS
// - afhankelijk van huur of koop heb je verschillende vragen
// AUTO
// - meerdere auto's toevoegen

const allInputs = d3.selectAll('#uw_situatie input, #uw_situatie select')._groups[0],
    allQuestionCategories = d3.selectAll('.question_category')._groups[0]

document.querySelectorAll('#uw_situatie input, #uw_situatie select').forEach(input => input.addEventListener('input', function () {
    updateProgressbar() //progress-bar
    updateProgressIndicators(this) //progress indicator
    updateTotalIncome(this) //total income
}))

function updateProgressbar() {
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
    let uniqueInputs = allInputs.length - (numberOfTotalRadio / 2),
        progression = document.querySelector('#uw_situatie #progression').parentElement.getBoundingClientRect().width / uniqueInputs * inputsWithValue
    document.querySelector('#uw_situatie #progression').style.paddingRight = progression + "px"

}

// function updateProgressIndicators(currentEl) {
//     while (currentEl.classList.contains('question_category') != true) {
//         currentEl = currentEl.parentElement
//     }
//     console.log(currentEl)


//     // geef alle verstopte inputs een data-optional-path attr
//     // updateProgressIndicators() moet dynamisch kunnen kijken of er paths
// }

//TODO:
// * de onderstaande functie herschrijven zodat die hardcoded is om rekening te houden met de radio-buttons & select etc.
// * dit zou betekenen dat de alle dynamische vragen/inputs in de HTML (hardcoded) gezet kunnen worden en op deze manier hoef je niet te kloten met elementen aanmaken
function updateProgressIndicators(currentEl) {
    // TODO: let op onderstaande notities:
    // ! deze methode houd geen rekening met de verschillende dynamische inputs
    // ! alle mogelijke inputs binnen de huidige fieldset worden opgehaald
    // ! dit betekent dat alle dynamische inputs (alle inputs die afhangen van de antwoorden van de gebruiker) moeten dynamisch gemaakt worden (d3 of JS)
    // ! chech hier de HMTL nog ff op, want op dit moment staan alle mogelijkheden in de HTML -> deze moeten dus dynamisch aangemaakt gaan worden
    // ! als deze dynamisch aangemaakt worden dan werkt deze functie, als je dit niet doet dan moet je deze functie herschrijven
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
        currentEl.querySelector('div>span:first-of-type').classList.add('hasAnswer')
        currentEl.classList.add('hide')

        const nextEl = document.querySelector("[data-question='" + (parseInt(currentEl.dataset.question) + 1) + "']"),
            nextElInput = nextEl.querySelectorAll('input, select')[0]
        nextEl.classList.remove('hide')
        if (nextElInput.type !== 'radio' && nextElInput.tagName !== 'SELECT') {
            nextElInput.focus()
        }
    } else {
        currentEl.querySelector('div>span:first-of-type').classList.remove('hasAnswer')
    }
}

//total income
function updateTotalIncome(currentEl) {
    while (currentEl.classList.contains('question_category') != true) {
        currentEl = currentEl.parentElement
    }

    const allCurrentInputs = currentEl.querySelectorAll('input')
    let totalIncome = 0

    for (const currentInput of allCurrentInputs) {
        if (currentInput.value != '') {
            totalIncome = totalIncome + parseInt(currentInput.value)
        }
    }
    document.getElementById('totaleInkomen').textContent = totalIncome + " euro"
}

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

//car dynamic-inputs
document.getElementById('car').addEventListener('input', function () {
    document.getElementById('has_a_car').classList.remove('hide')
})