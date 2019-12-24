import data from './modules/loadData.js'
import transform from './modules/transformData.js'

const allInputs = d3.selectAll('#uw_situatie input, #uw_situatie select')._groups[0],
    allQuestionCategories = d3.selectAll('.question_category')._groups[0],
    labels = document.querySelectorAll('form label'),
    tooltip = document.querySelector('#tooltip'),
    digitRegex = /^\d+$/

let tooltipData

data.getData()
    .then(string => transform.createIndividualObjects(string))
    .then(csvRows => transform.createHousehold(csvRows))
    .then(data => console.log(data))
    .catch(err => console.log(err))

data.getTooltips()
    .then(data => tooltipData = data)
    .then(data => selectLabelsforTooltips())
    .catch(err => console.log(err))


//tooltip
// TODO: tooltip werkt niet volledig met scroll, form half uit viewport
function selectLabelsforTooltips() {
    Object.entries(tooltipData).forEach(entry => {
        labels.forEach(label => {
            if (label.getAttribute('for') == entry[0]) {
                label.dataset.has_tooltip = true

                let tooltipIcon = new Image
                tooltipIcon.classList.add('tooltip-icon')
                tooltipIcon.src = "./media/tooltip-icon.svg"
                label.append(tooltipIcon)

                tooltipIcon.addEventListener('mouseover', function () {
                    tooltip.children[0].textContent = entry[1]
                    tooltip.style.display = 'block'
                    tooltip.style.left = (event.clientX + 20 + 'px')
                    tooltip.style.top = (window.innerHeight + event.clientY + -60 + 'px')
                })
                tooltipIcon.addEventListener('mouseout', function () {
                    tooltip.style.display = 'none'
                })
            }
        })
    })
}

// TODO: (voor het eerste form)
// GEZIN
// - kinderen (dynamisch)
// - inkomen (standaard + mogelijk partner)
// HUIS
// - afhankelijk van huur of koop heb je verschillende vragen
// AUTO
// - meerdere auto's toevoegen

document.querySelectorAll('#uw_situatie input, #uw_situatie select').forEach(input => input.addEventListener('input', function () {
    checkIfValueIsAllowed(this) //value validation
    updateProgressbar() //progress-bar
    updateProgressIndicators(this) //progress indicator
    updateTotalIncome(this) //total income
    fixSelectFocus(this) //fix select focus state
}))

function checkIfValueIsAllowed(currentEl) {
    let minIsValid = false,
        maxIsValid = false

    if (currentEl.type === 'number') {
        if (parseInt(currentEl.value) < parseInt(currentEl.min) === false && digitRegex.test(currentEl.value) === true) {
            minIsValid = true
        }
        if (parseInt(currentEl.value) > parseInt(currentEl.max) === false && digitRegex.test(currentEl.value) === true) {
            maxIsValid = true
        }

        if (maxIsValid && minIsValid) {
            currentEl.classList.remove('invalid')
        } else {
            currentEl.classList.add('invalid')
        }
    }
    // TODO: voeg een invalid-text, met; 'Waardes moeten tussen 'min-value' - 'max-value' zijn & waardes mogen geen interpunctie bevatten'
    // maak dynamisch in JS een div aan die deze instructie bevat (en verwijdert word als die goed ingevuld is)
}

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

    let hasInvalidValue = false
    for (const input of allInputs) {
        if (input.classList.contains('invalid')) {
            hasInvalidValue = true
        }
    }
    if (inputsWithValue === uniqueInputs && hasInvalidValue === false) {
        document.querySelector('section:nth-of-type(2) form').classList.remove('hide')
    } else {
        document.querySelector('section:nth-of-type(2) form').classList.add('hide')
        document.getElementById('progression').classList.add('invalidProgress')
    }
    if (hasInvalidValue === false) {
        document.getElementById('progression').classList.remove('invalidProgress')
    }
}

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
        numberOfRadio = 0,
        hasInvalidValue = false

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
    } else {
        currentEl.querySelector('div>span:first-of-type').classList.remove('hasAnswer')
    }

    for (const currentInput of allCurrentInputs) {
        if (currentInput.classList.contains('invalid')) {
            hasInvalidValue = true
        }
    }
    if (hasInvalidValue) {
        currentEl.querySelector('div>span:first-of-type').classList.add('invalidValue')
    } else {
        currentEl.querySelector('div>span:first-of-type').classList.remove('invalidValue')
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
            document.getElementById('totaleInkomen').textContent = totalIncome + " euro"
        }
    }
}

//fix SELECT El focus
function fixSelectFocus(currentEl) {
    if (currentEl.tagName === 'SELECT') {
        currentEl.parentElement.focus()
    }
}

//progressive disclosure
allQuestionCategories.forEach(category => {
    category.addEventListener('click', function () {
        for (const question of allQuestionCategories) {
            question.classList.remove('hide')
            question.classList.add('hide')
        }
        this.classList.remove('hide')
        this.querySelectorAll('input, select')[0].focus()

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